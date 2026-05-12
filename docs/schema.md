# Yuvabe ATS — Canonical Schema Reference

> Snake_case in Postgres. camelCase in TypeScript. The `lib/*-store.ts` adapters
> are the only place the conversion happens.
>
> Rule: **data accessed together is stored together.**  
> Sub-collections that are never queried independently of their parent live as
> `jsonb` inside that parent. Rows that have their own lifecycle, or are queried
> independently, get their own table.

---

## Entity map

```
jobs ──────────────────────────< applications >──────────── candidates
  └── criteria[]  (jsonb)           │                         └── links      (jsonb)
  └── (history) ──────────────< job_criteria_history          └── skills     (jsonb)
                                    │                          └── experience (jsonb)
                               application_notes               └── education  (jsonb)

users  (future auth / RBAC — stubbed, not active)
```

---

## `jobs`

One row per posted role.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | Semantic or `crypto.randomUUID()` |
| `code` | `text` UNIQUE NOT NULL | 6-char public identifier, e.g. `PDDS4M` |
| `title` | `text` NOT NULL | Display name of the role |
| `description` | `text` NOT NULL | Raw JD text, used for LLM extraction |
| `criteria` | `jsonb` NOT NULL | Array of `Criterion` objects (shape below) |
| `status` | `text` NOT NULL | `draft \| active \| paused \| closed` — default `draft` |
| `created_at` | `timestamptz` NOT NULL | Row creation time |
| `published_at` | `timestamptz` | When status moved to `active` |
| `paused_at` | `timestamptz` | When status moved to `paused` |
| `closed_at` | `timestamptz` | When status moved to `closed` |

**`criteria` JSONB shape — `Criterion[]`**

```jsonc
[
  {
    "id": "cr_8char",           // stable nanoid — never changes on rename
    "category": "skill",        // skill | experience | education | domain | other
    "label": "Figma proficiency",
    "importance": "must",       // must | preferred | nice
    "weight": 3                 // 1–5, default 1; hiring manager override
  }
]
```

`importance` tiers:
- `must` — disqualifying if absent; blocking for shortlisting
- `preferred` — heavily weighted in scoring; not blocking
- `nice` — bonus only; does not hurt score if absent

`weight` (1–5) multiplies the raw criterion score when computing the overall
`match_score`, letting a hiring manager signal that one `must` matters more than
another. Stored now; scoring formula update is a separate code change.

**Indexes**

```sql
create index jobs_status_idx on jobs (status);
create index jobs_created_at_idx on jobs (created_at desc);
```

---

## `candidates`

One row per person, identified by email. Skills, experience, and education are
embedded because they are always read with the person and never queried independently.

**Resume lives on `applications`, not here** — a person submits potentially
different resumes to different roles.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | |
| `name` | `text` NOT NULL | Full display name |
| `email` | `text` UNIQUE NOT NULL | Used for duplicate-applicant detection |
| `phone` | `text` NOT NULL | Default `''` |
| `location` | `text` NOT NULL | Default `''` |
| `summary` | `text` NOT NULL | Short bio, extracted from most recent resume |
| `years_of_experience` | `int` NOT NULL | Default `0` |
| `skills` | `jsonb` NOT NULL | `string[]` |
| `experience` | `jsonb` NOT NULL | `WorkEntry[]` (shape below) |
| `education` | `jsonb` NOT NULL | `EducationEntry[]` (shape below) |
| `links` | `jsonb` NOT NULL | `Links` object (shape below) |
| `created_at` | `timestamptz` NOT NULL | |
| `updated_at` | `timestamptz` NOT NULL | Updated on any profile field change |

**`experience` JSONB shape — `WorkEntry[]`**

```jsonc
[
  {
    "company": "Helio AI",
    "title": "Senior ML Engineer",
    "start_date": "2022-09",
    "end_date": "present",
    "description": "..."
  }
]
```

**`education` JSONB shape — `EducationEntry[]`**

```jsonc
[
  {
    "institution": "BITS Pilani",
    "degree": "B.E. Computer Science",
    "year": 2019
  }
]
```

**`links` JSONB shape**

```jsonc
{
  "linkedin":  "linkedin.com/in/aisha-khan",  // null if not provided
  "github":    "github.com/aishak",
  "portfolio": "aishak.design",
  "email":     "aisha@example.com"            // rarely different from candidates.email
}
```

Missing-link detection is a UI concern: the profile card reads `links.linkedin == null`
and renders a "Link missing" badge. No extra schema needed.

---

## `applications`

One row per candidate per job submission.

A candidate may apply to many jobs, each with a different resume. The
`UNIQUE (candidate_id, job_id)` constraint enforces one active application per
candidate per role.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | |
| `job_id` | `text` NOT NULL → `jobs.id` ON DELETE CASCADE | |
| `candidate_id` | `text` NOT NULL → `candidates.id` ON DELETE CASCADE | |
| `job_code` | `text` NOT NULL | Snapshot — fast route lookups |
| `job_title` | `text` NOT NULL | Snapshot — shown on global applicants list |
| `candidate_name` | `text` NOT NULL | Snapshot |
| `candidate_email` | `text` NOT NULL | Snapshot |
| `candidate_location` | `text` NOT NULL | Snapshot |
| `candidate_years_of_experience` | `int` NOT NULL | Snapshot |
| `resume_url` | `text` | Storage path / signed URL for the file submitted for this role |
| `resume_text` | `text` NOT NULL | Parsed plain text of the resume for this role |
| `cover_letter` | `text` NOT NULL | Default `''` |
| `match_score` | `int` NOT NULL | 0–100; `CHECK (match_score BETWEEN 0 AND 100)` |
| `previous_match_score` | `int` | Score before the last re-analysis — null if never re-analyzed; used for the score-change indicator |
| `scored_at` | `timestamptz` | When the LLM last scored this application — null if not yet scored; compare against `job_criteria_history.changed_at` to detect stale scores |
| `must_score` | `int` | Aggregate score across Must criteria (0–100); populated on every score write |
| `preferred_score` | `int` | Aggregate score across Preferred criteria (0–100); populated on every score write |
| `nice_score` | `int` | Aggregate score across Nice criteria (0–100); populated on every score write |
| `match_summary` | `text` NOT NULL | Editorial paragraph explaining the overall score |
| `match_breakdown` | `jsonb` NOT NULL | `BreakdownRow[]` — one per criterion (shape below) |
| `status` | `text` NOT NULL | See pipeline stages below; default `new` |
| `received_at` | `timestamptz` NOT NULL | When the application arrived |
| `updated_at` | `timestamptz` NOT NULL | Last status or field change |

**Unique constraint**

```sql
alter table applications
  add constraint applications_candidate_job_unique
  unique (candidate_id, job_id);
```

**Pipeline `status` values**

| Value | Meaning |
|---|---|
| `new` | Received, unreviewed |
| `reviewing` | Recruiter opened it |
| `shortlisted` | Confirmed good fit |
| `interview_scheduled` | Interview booked |
| `interviewed` | Interview completed |
| `offered` | Offer extended |
| `hired` | Offer accepted, hired |
| `rejected` | Not progressing |
| `withdrawn` | Candidate withdrew |

**`match_breakdown` JSONB shape — `BreakdownRow[]`**

```jsonc
[
  {
    "criterion_id":    "cr_8char",           // stable ref to Criterion.id
    "criterion_label": "Figma proficiency",  // denormalized for display
    "importance":      "must",
    "matched":         "yes",                // yes | partial | no
    "score":           9,                    // 0–10
    "evidence":        "Led design system of 40+ Figma components."
  }
]
```

`criterion_id` ensures that renaming a criterion label ("Figma proficiency" →
"Figma + Sketch") does not orphan existing breakdown rows — they still resolve
to the correct criterion via `id`.

**Indexes**

```sql
create index applications_job_code_idx on applications (job_code);
create index applications_job_code_match_score_idx on applications (job_code, match_score desc);
create index applications_received_at_idx on applications (received_at desc);
create index applications_status_idx on applications (status);
create index applications_candidate_email_idx on applications (candidate_email);
```

---

## `application_notes`

Team-visible structured notes on an application. One application can have many
notes from multiple reviewers — replaces external spreadsheets or email threads.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | |
| `application_id` | `text` NOT NULL → `applications.id` ON DELETE CASCADE | |
| `author_email` | `text` NOT NULL | Reviewer email; becomes `user_id` FK once auth lands |
| `body` | `text` NOT NULL | Note content |
| `created_at` | `timestamptz` NOT NULL | |
| `updated_at` | `timestamptz` NOT NULL | |

**Index**

```sql
create index application_notes_application_id_idx
  on application_notes (application_id, created_at desc);
```

---

## `job_criteria_history`

Append-only audit log — one row per criteria edit on a job. Answers "who changed
criteria and when" and powers future score-change alerts when criteria are
modified mid-pipeline.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | |
| `job_id` | `text` NOT NULL → `jobs.id` ON DELETE CASCADE | |
| `changed_by` | `text` NOT NULL | Reviewer email; becomes `user_id` FK once auth lands |
| `changed_at` | `timestamptz` NOT NULL | Default `now()` |
| `criteria_before` | `jsonb` NOT NULL | Full criteria array before the edit |
| `criteria_after` | `jsonb` NOT NULL | Full criteria array after the edit |
| `change_note` | `text` NOT NULL | Human note explaining the change; default `''` |

**Index**

```sql
create index job_criteria_history_job_id_idx
  on job_criteria_history (job_id, changed_at desc);
```

---

## `users` _(stubbed — not active until auth is implemented)_

Included so FK targets exist when RBAC is wired in. The `author_email` and
`changed_by` text columns on `application_notes` and `job_criteria_history` will
be replaced by `user_id` FK references at that point.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | |
| `email` | `text` UNIQUE NOT NULL | |
| `name` | `text` NOT NULL | |
| `role` | `text` NOT NULL | `admin \| manager \| viewer` — default `viewer` |
| `created_at` | `timestamptz` NOT NULL | |

Role permissions (future):
- `admin` — manages jobs, criteria, all candidates
- `manager` — views shortlists, leaves notes, cannot edit JDs
- `viewer` — read-only access to shortlists

---

## What moved and why

| What | Old location | New location | Reason |
|---|---|---|---|
| `resume_text` | `candidates` | `applications` | A candidate may submit a different resume per role |
| `resume_url` | — | `applications` | New: file link for download / inline preview |
| `job_title` | — (join required) | `applications` (snapshot) | Global applicants list needs it without a join |
| `archived_at` | `jobs` | Removed → `status = 'closed'` + `closed_at` | Explicit status is queryable and extensible |

---

## Deferred (out of scope for this schema version)

- **Criteria weight in scoring formula** — `weight` is stored; formula update is a separate code change
- **Score change alerts** — computed from `job_criteria_history` + re-scoring; a background job concern
- **Shortlist export** — a computed query, no schema needed
- **Duplicate applicant detection UI** — query `applications` count per `candidate_id`; no schema needed
- **Bulk actions** — UI concern; no schema needed
- **Email intake / Postmark webhook** — per original PRD deferral
- **Auth + RLS** — `users` table stubbed; full implementation deferred
