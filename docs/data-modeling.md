# Data modeling in the Yuvabe ATS

A working note on how Job, Application, and Candidate are connected, why the shape we picked is NoSQL-friendly, and the small improvements we're making to keep it that way.

This is intended to be readable by anyone on the team — engineering, product, or recruiting-stakeholder — without needing to dive into the code.

---

## The one rule

> **Data that's accessed together should be stored together.**

That single sentence is the foundation of NoSQL schema design. It comes from MongoDB's docs but Couchbase, Cosmos DB, and DynamoDB all teach the same thing. Every other rule (when to embed, when to reference, when to denormalize) follows from it.

The corollary is the part that surprises people coming from relational design:

> **You cannot design a NoSQL schema without first listing how the data will be queried.**

Relational design starts with "what are the entities and what are their relationships?" NoSQL design starts with "what are the queries the app will run?" The schema is downstream of the access patterns, not upstream.

If you remember nothing else from this doc, remember that.

---

## What we have today

The ATS has three top-level entities. Each has its own JSON file (today) and will become its own collection / table when we move to a real database.

```
Job ────────────< Application >───────── Candidate

Job
  ├── id
  ├── code            (6-char public identifier, e.g. "PDDS4M")
  ├── title
  ├── description     (raw JD text)
  ├── criteria[]      ← embedded inside the Job
  └── createdAt

Candidate
  ├── id
  ├── name, email, phone, location
  ├── summary, yearsOfExperience
  ├── skills[]        ← embedded
  ├── experience[]    ← embedded (each: company, title, dates, description)
  ├── education[]     ← embedded (each: institution, degree, year)
  ├── links?          ← embedded (linkedin, portfolio, github)
  └── resumeText

Application                              (one per applicant per job per submission)
  ├── id
  ├── jobId           → Job.id
  ├── jobCode         → Job.code        (denormalized — fast lookups)
  ├── candidateId     → Candidate.id
  ├── matchScore      (0–100)
  ├── matchSummary    (editorial paragraph)
  ├── matchBreakdown[] ← embedded — one row per Job's criterion
  ├── coverLetter
  ├── receivedAt
  └── status          (new / reviewing / shortlisted / rejected / offered)
```

**Three references** (Application → Job, Application → Candidate, breakdown row → criterion).
**Five embedded sub-collections** (criteria, skills, experience, education, matchBreakdown).

---

## Applying the rule

Walk through the queries. For each one, note what gets fetched together — that's what should be stored together.

| Page / route | Data needed |
|---|---|
| `/jobs` | Every Job; count of Applications per Job |
| `/jobs/[code]` | One Job; its Applications; each applicant's name/email/location |
| `/apply` | One Job (just the title to render the header) |
| `/applications` | Every Application; each applicant's name/email/location; each Job's title |
| `/applications/[id]` | One Application; the **full** Candidate profile; the Job it's for |
| Submitting `/api/applications` | Read one Job; write one Candidate + one Application |

Notice what's *not* on the list:
- "All criteria across all jobs" — we never need this
- "All match breakdown rows for one criterion" — we never need this either
- "All experience entries for all candidates" — never

So criteria, breakdown rows, and experience entries should live *inside* their parent — they're never queried independently. That's why all three are embedded today.

---

## Why this shape is NoSQL-friendly

**Embedding rule of thumb (MongoDB-school):**

| Relationship | Default |
|---|---|
| One-to-one | Embed |
| One-to-few (capped, predictable) | Embed |
| One-to-many that grows unbounded | Reference |
| Many-to-many | Reference (with optional denormalized snapshots) |

Apply it to our entities:

- `Job.criteria[]` — 8 to 16 items, locked at posting → **embed** ✓
- `Candidate.experience[]` — typically 1 to 10 — **embed** ✓
- `Candidate.education[]` — typically 1 to 5 → **embed** ✓
- `Application.matchBreakdown[]` — exactly equal to the parent Job's criteria count, never queried separately → **embed** ✓
- Application → Job — one Application has one Job → **reference** ✓
- Application → Candidate — one Application has one Candidate, but a Candidate can have many Applications → **reference** ✓

Every choice the codebase made follows the rule.

---

## Where we're slightly off

Three small gaps. None are bugs today, but each is the kind of thing that becomes painful if left until we're at scale.

### Gap 1 — the embedded criteria don't have IDs

Today:

```ts
type Criterion = { category, label, importance };  // no id
```

A `matchBreakdown` row references its criterion by `criterionLabel` — a string. If a recruiter renames "Figma proficiency" to "Figma + Sketch", every existing application's breakdown row is silently orphaned: it still says "Figma proficiency".

This is the **classic NoSQL trap**. When you embed, you lose the automatic foreign-key integrity a relational DB would give you. You have to replace it with discipline — explicitly carry an `id` across boundaries.

**Fix:** give each Criterion a stable `id` (a short nanoid). The `matchBreakdown` row records `criterionId` alongside the denormalized label. Renames stop orphaning.

**Lesson:** *When you embed a sub-collection that gets referenced from outside, give every row an id. Even if you don't think you'll need it.*

### Gap 2 — listing pages fan out three queries

`/applications` and `/jobs/[code]` each do three reads and join in JavaScript:

```ts
const allApplications = await listApplications();    // 1
const candidates = await listCandidates();           // 2 — only used for name/email/location
const jobs = await listJobs();                       // 3
// then a JS-side join on candidateId / jobId
```

With a local JSON file this is free — everything's already in memory. With Supabase or MongoDB it's three round trips per page load, including a full scan of the candidates table just to look up a name.

**Fix:** at submission time, write a snapshot of the Candidate's name / email / location *onto* the Application row. List views read from the snapshot. The detail view (`/applications/[id]`) still fetches the full Candidate doc because it renders the rich profile (experience, education, skills) — snapshots are just for list views.

**Why this is safe:** name, email, and location are written once on apply and almost never change. Read-heavy, write-rare → perfect denormalization candidates.

**Lesson:** *Denormalize fields that are read often and updated rarely. Frequently-updated fields are the wrong target — you'll create write amplification.*

### Gap 3 — the rules aren't captured anywhere reusable

Every time we add a new entity (next: Interview? Stage? FeedbackNote?), we'll re-derive these principles. Worse — without docs and tooling, future code might quietly break the patterns.

**Fix:** a `yuvabe-data-modeling` skill that activates when relevant code is being changed. The skill encodes the rule, the embedding decision tree, the denormalization heuristics, and a checklist for adding new entity types.

**Lesson:** *Architectural discipline outlives no-one. Skills, docs, and conventions are how it survives.*

---

## What we're going to ship

Four small stages. Each is independently verifiable. None of them are visible in the UI — the user-facing app behaves identically — but each makes the model cleaner for the next person who touches it.

| Stage | What changes | Visible to a user? |
|---|---|---|
| R1 | Each Criterion gains an `id`; each matchBreakdown row gains an optional `criterionId` | No |
| R2 | Each Application gains `candidateName`, `candidateEmail`, `candidateLocation` snapshots written at submission time | No |
| R3 | Listing pages stop fetching the candidates table; they read from snapshots | No (but logs show fewer fetches) |
| R4 | A `yuvabe-data-modeling` skill is added that activates whenever entity types or store files are being modified | No, until next time someone changes the data model — at which point the skill surfaces this doc and its checklist |

Backwards compatible: all field additions are *additive*. Existing data parses correctly without these new fields, and we backfill them lazily on read.

---

## A checklist you can apply to *any* new entity

When the team adds the next thing — say, an `Interview` entity tracking a recruiter's note about a candidate after a phone screen — work through this list **before** writing the schema:

1. **What queries will the app run that touch this entity?** Write them out as a list, before you write any code.
2. **Is this top-level or embedded?** Embed if it's only ever read with its parent. Top-level if it has its own lifecycle or independent queries.
3. **What sub-collections does it embed?** Apply the one-to-few rule.
4. **What references does it carry?** What other entity does it point to? Is the relationship one-to-one, one-to-few, or one-to-many?
5. **What does it denormalize?** For each list view, identify which fields from referenced entities are needed. If those fields are write-rare, snapshot them.
6. **What happens when an upstream entity changes?** If the parent changes a field that this entity has snapshotted, is that field expected to update everywhere — or is the snapshot a "point in time" record? Both are valid; pick consciously.
7. **Add the MIGRATION BOUNDARY header.** The new store file is the only place `fs.*` (or future `supabase.*` / `mongodb.*`) lives.
8. **Match camelCase + additive conventions.** New fields default-safe so old data still parses.

If you can answer all eight, you have a NoSQL-friendly schema that will survive the swap to Supabase or MongoDB without surprises.

---

## Further reading

- [MongoDB: Schema Design Best Practices](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/) — the canonical "data accessed together" rule
- [MongoDB: 6 Rules of Thumb for Schema Design](https://www.mongodb.com/company/blog/mongodb/6-rules-of-thumb-for-mongodb-schema-design) — embedding vs referencing decision tree
- [Azure Cosmos DB: Data Modeling](https://learn.microsoft.com/en-us/azure/cosmos-db/modeling-data) — same principles, slightly more general framing
- [Couchbase: When to Embed, When to Refer](https://www.couchbase.com/blog/data-modelling-when-embed-or-refer/) — practical checklist
- The codebase: each `lib/*-store.ts` file has a `MIGRATION BOUNDARY` header documenting how it'll be swapped to a real DB
