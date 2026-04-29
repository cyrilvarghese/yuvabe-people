# Yuvabe ATS — MVP PRD

## What this is

A concept-proving prototype. We're not building a product yet — we're proving that four things work together:

1. An email arriving at a single inbox can be **read** (resume + cover note extracted).
2. It can be **categorized** to the right open job using an LLM.
3. The applicant can be **matched** to that job with a useful, explainable score.
4. HR and the hiring manager can **collaborate** on the resulting list and move candidates forward together — without stepping on each other or losing context.

If those four work, the concept is proven and we invest in v2. Anything not directly serving these four is out of scope for this build.

---

## Tech stack (locked)

- **Next.js 15** (App Router) + TypeScript strict
- **Postgres** via Prisma
- **OpenAI** (`gpt-4o-mini` for classification, `gpt-4o` for scoring) behind a thin `lib/llm.ts` wrapper
- **Postmark Inbound** → webhook for email intake
- **Local filesystem** for resume storage (`./uploads`) — S3 later
- **NextAuth** (Credentials provider, email + password) — no SSO, no MFA
- **Tailwind + shadcn/ui** for UI

Env vars: `DATABASE_URL`, `OPENAI_API_KEY`, `POSTMARK_INBOUND_TOKEN`, `NEXTAUTH_SECRET`, `SCHEDULING_LINK`.

---

## User roles & the collaboration model

Two roles. The collaboration model is the part of this PRD most worth getting right, because it's one of the four things we're proving.

**HR / Recruiter**
- Creates jobs and competency profiles.
- Monitors the intake queue. Fixes anything in `NEEDS_REVIEW`.
- **Triages** the matched applicant list: marks candidates as `SHORTLISTED` (recommended for the hiring manager to look at) or leaves them as `SCORED`.
- Can leave notes on any application.

**Hiring Manager**
- Sees only jobs assigned to them.
- Sees the full ranked list, with HR's shortlist highlighted at the top.
- **Approves or rejects** candidates. Approval is the terminal positive action.
- Can leave notes; can ask HR a question via a note.

**The collaboration loop in one sentence:** HR shortlists, HM approves, both leave notes on the same application, an activity log shows who did what when. No emails between them, no spreadsheet, no "did you see this candidate" — it all lives on the application record.

This means three things must be true in the UI:
- Both roles look at the same application page and see the same notes and activity.
- Status transitions are visible to both (`NEW → SCORED → SHORTLISTED → APPROVED/REJECTED`).
- A simple activity log on each application shows every status change and note, with who and when.

---

## Data model

Schema below is the source of truth.

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role
  createdAt DateTime @default(now())
  notes     Note[]
  approvals Approval[]
  jobs      Job[]    @relation("HiringManagerJobs")
}

enum Role { RECRUITER  HIRING_MANAGER }

model Job {
  id                  String              @id @default(cuid())
  title               String
  description         String              @db.Text
  department          String
  location            String
  customCriteria      Json                // [{ key, label, required: bool }]
  competencyProfileId String?
  competencyProfile   CompetencyProfile?  @relation(fields: [competencyProfileId], references: [id])
  status              JobStatus           @default(OPEN)
  hiringManagerId     String?
  hiringManager       User?               @relation("HiringManagerJobs", fields: [hiringManagerId], references: [id])
  applications        Application[]
  createdAt           DateTime            @default(now())
}

enum JobStatus { OPEN  CLOSED }

model CompetencyProfile {
  id           String   @id @default(cuid())
  roleTitle    String   @unique
  competencies Json     // [{ name, weight (0..1), description }]
  jobs         Job[]
  createdAt    DateTime @default(now())
}

model Application {
  id              String            @id @default(cuid())
  jobId           String?
  job             Job?              @relation(fields: [jobId], references: [id])
  applicantName   String
  email           String
  phone           String?
  resumeFilePath  String
  resumeText      String?           @db.Text
  coverNoteText   String?           @db.Text
  location        String?
  rawEmail        Json?             // full Postmark payload for debugging
  receivedAt      DateTime          @default(now())
  status          ApplicationStatus @default(NEW)
  classificationConfidence Float?
  matchScore      MatchScore?
  approval        Approval?
  notes           Note[]
  activity        ActivityEvent[]
}

enum ApplicationStatus {
  NEW            // received, not yet scored
  SCORED         // matching done
  SHORTLISTED    // HR recommends to HM
  APPROVED       // HM said yes
  REJECTED       // HM said no
  NEEDS_REVIEW   // classification or parsing failed
}

model MatchScore {
  id                  String      @id @default(cuid())
  applicationId       String      @unique
  application         Application @relation(fields: [applicationId], references: [id])
  jdFitScore          Float       // 0..100
  jdFitBreakdown      Json        // { skills, experience, domain, communication, reasoning }
  competencyScore     Float?      // 0..100, null if no profile linked
  competencyBreakdown Json?       // [{ name, score, reasoning }]
  locationMatch       Boolean
  customMatch         Boolean
  customMatchDetails  Json
  overallScore        Float
  scoredAt            DateTime    @default(now())
}

model Approval {
  id            String      @id @default(cuid())
  applicationId String      @unique
  application   Application @relation(fields: [applicationId], references: [id])
  decidedById   String
  decidedBy     User        @relation(fields: [decidedById], references: [id])
  decision      Decision
  decidedAt     DateTime    @default(now())
}

enum Decision { APPROVE  REJECT }

model Note {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  authorId      String
  author        User        @relation(fields: [authorId], references: [id])
  body          String      @db.Text
  createdAt     DateTime    @default(now())
}

model ActivityEvent {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  actorId       String?     // null for system events (intake, scoring)
  type          String      // "received" | "classified" | "scored" | "shortlisted" | "approved" | "rejected" | "noted" | "scheduling_invited"
  metadata      Json?
  createdAt     DateTime    @default(now())
}
```

Indexes: `Application(jobId, status)`, `Application(receivedAt desc)`, `MatchScore(overallScore desc)`.

**Every status change and note creation must write an `ActivityEvent`.** This is what powers the collaboration log — non-negotiable.

---

## The four flows

### Flow 1 — Email intake (proving "can be read")

Endpoint: `POST /api/inbound/email` (Postmark webhook).

1. Verify Postmark token.
2. Pick the most likely resume attachment: PDF or DOCX, largest file. Save to `./uploads/{applicationId}/{filename}`.
3. Parse to text — `pdf-parse` for PDFs, `mammoth` for DOCX. If parsing fails, create the `Application` with `status = NEEDS_REVIEW` and stop here.
4. Treat the email body as the cover note (strip the signature with a "--" or "Sent from" heuristic).
5. Pull applicant name and email from headers.
6. Save full payload to `Application.rawEmail` for debugging.
7. Trigger Flow 2.

**Manual upload fallback:** `POST /api/applications` (multipart) with resume file, cover note text, applicant fields, and an explicit `jobId`. Skips classification, runs from Flow 3.

### Flow 2 — Classification (proving "can be categorized")

LLM call (see Prompts → Classification). Inputs: list of all `OPEN` jobs (id, title, department, one-line summary), parsed resume text, cover note. Output: `{ jobId, confidence, reasoning }`.

- If `confidence >= 0.6`: attach to that job, set `status = NEW`, trigger Flow 3.
- If `confidence < 0.6`: leave `jobId = null`, set `status = NEEDS_REVIEW`. HR fixes manually from the `/needs-review` queue (dropdown to pick a job, then re-trigger matching).

Write an `ActivityEvent` of type `classified` with the model's reasoning in metadata, regardless of outcome.

### Flow 3 — Matching (proving "can be matched")

Synchronous, runs immediately after classification (or manual upload).

1. **JD fit** — LLM call with JD + resume + cover note. Returns score 0–100 with sub-scores for skills, experience, domain, communication, plus reasoning. (See Prompts → JD Fit.)
2. **Competency fit** — LLM call with competency profile + resume. Returns a per-competency score 0–100 with reasoning. Composite competency score is computed in code as `sum(score * weight)`. If no profile linked to the job, skip and set null.
3. **Hard filters** — deterministic:
   - `locationMatch`: true if job location is "Remote" or string-matches applicant location (case-insensitive, city-level).
   - `customMatch`: true if all `required: true` custom criteria are present in the resume text (simple keyword search for v1 — accept this is crude; we'll improve later).
4. **Overall score:**
   ```
   base = (0.6 * jdFitScore) + (0.4 * competencyScore)
       // if competencyScore null, base = jdFitScore
   multiplier = 1.0
   if !locationMatch: multiplier *= 0.7
   if !customMatch:   multiplier *= 0.7
   overallScore = base * multiplier
   ```
   Soft penalties, not hard exclusions — recruiters can still see the candidate.

Persist `MatchScore`, set `Application.status = SCORED`, write `scored` activity event.

Send applicant the auto-acknowledgment: "Thanks for applying to {jobTitle} at Yuvabe. We'll be in touch."

### Flow 4 — Collaboration & approval (proving "HR and HM can work together")

This is the most important screen. Get this right or the demo fails.

**Job detail page** (`/jobs/{id}`): ranked applicant table, default sort by `overallScore` desc.

Columns: name | overall | JD fit | competency | location ✓/✗ | status badge | received | quick actions.

Status badge colors:
- `NEW` / `SCORED` — gray
- `SHORTLISTED` — blue (HR has flagged this for HM)
- `APPROVED` — green
- `REJECTED` — muted/strikethrough
- `NEEDS_REVIEW` — amber

Filters: by status, by department (department is the parent job's department, displayed as a tag for consistency with any future "all applications" view).

**Quick actions per role:**
- HR sees: `Shortlist` button (when status is `SCORED`).
- HM sees: `Approve` and `Reject` buttons (when status is `SCORED` or `SHORTLISTED`).
- Both see: `Open` to drill into application detail.

**Bulk actions:** checkbox per row + bulk-shortlist (HR) or bulk-approve/reject (HM) at the top. This is the "approve, approve, approve" UX from the original ask.

**Application detail page** (`/applications/{id}`):

Three sections, top to bottom:
1. Header: applicant name, email, phone, resume download link, current status, overall score.
2. Score breakdown: JD fit sub-scores with reasoning, per-competency scores with reasoning, hard-filter results. Reasoning is collapsed by default; click to expand. **Never show a number without showing the reasoning behind it.** This is what makes scores trustworthy.
3. Collaboration panel:
   - **Notes** — chronological list, both roles see all notes, both can add. Show author + timestamp.
   - **Activity log** — chronological list of every event: received, classified (with confidence), scored, shortlisted by X, approved/rejected by Y, notes added.

**Approved candidates → scheduling handoff:**

For MVP, "handoff" is a single action: `POST /api/applications/{id}/send-to-scheduling` triggers an email to the candidate with a Calendly link (config: `SCHEDULING_LINK` env var). Status stays `APPROVED`; we add a `scheduling_invited` activity event. We're not building scheduling — we're proving the workflow ends cleanly.

---

## Prompts

Keep these in `lib/prompts/` as versioned files (`classification.v1.ts`, `jdFit.v1.ts`, `competency.v1.ts`). Use OpenAI structured output (`response_format: json_schema`) for all three. `temperature = 0` everywhere.

### Classification (`gpt-4o-mini`)

```
System: You are routing job applications to the correct open role.

User:
Open jobs:
{for each job: id, title, department, one-line summary}

Applicant resume:
{resumeText, truncated to ~3000 tokens}

Cover note:
{coverNoteText}

Return the single best-matching job id, your confidence 0..1, and a one-sentence reason.
If no job is a reasonable fit, return jobId: null with confidence: 0.

Output schema: { jobId: string|null, confidence: number, reasoning: string }
```

### JD fit (`gpt-4o`)

```
System: You are an experienced technical recruiter scoring a resume against a job description. Be specific and grounded in evidence from the resume. Do not invent qualifications.

User:
Job description:
{jd}

Resume:
{resumeText}

Cover note:
{coverNoteText}

Score 0..100 on each dimension and overall:
- skills: technical and functional skills the JD asks for
- experience: years and relevance of past roles
- domain: industry/domain familiarity
- communication: clarity and signal in the cover note
- overall: holistic fit, weighted by your judgment

For each, give a one-sentence reason citing specific evidence.

Output schema: {
  overall: number,
  skills:        { score: number, reasoning: string },
  experience:    { score: number, reasoning: string },
  domain:        { score: number, reasoning: string },
  communication: { score: number, reasoning: string }
}
```

### Competency (`gpt-4o`)

```
System: You are scoring a candidate's resume against a defined competency profile for the role. Score each competency independently from 0..100, grounded in resume evidence.

User:
Competency profile:
{for each competency: name, weight, description}

Resume:
{resumeText}

For each competency, return score and one-sentence reasoning.

Output schema: { competencies: [{ name: string, score: number, reasoning: string }] }
```

---

## API surface

```
# Auth
POST   /api/auth/[...nextauth]

# Jobs
GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/{id}
PATCH  /api/jobs/{id}
GET    /api/jobs/{id}/applications

# Competency profiles
GET    /api/competency-profiles
POST   /api/competency-profiles
PATCH  /api/competency-profiles/{id}

# Applications
POST   /api/inbound/email                 # Postmark webhook
POST   /api/applications                  # manual upload
GET    /api/applications                  # list, with filters
GET    /api/applications/{id}
POST   /api/applications/{id}/rematch
POST   /api/applications/{id}/assign-job  # for NEEDS_REVIEW fixes
POST   /api/applications/{id}/shortlist   # HR
POST   /api/applications/{id}/approve     # HM
POST   /api/applications/{id}/reject      # HM
POST   /api/applications/{id}/send-to-scheduling
POST   /api/applications/{id}/notes
```

---

## UI screens (the only ones being built)

1. **Login** — email + password.
2. **Jobs list** (`/jobs`) — table of jobs. HR sees all; HM sees their assigned jobs.
3. **Job create/edit** (`/jobs/new`, `/jobs/{id}/edit`) — HR only. Form for title, JD, department, location, custom criteria, competency profile picker, hiring manager picker.
4. **Job detail / applicant queue** (`/jobs/{id}`) — the bulk-approve workhorse. (Detailed in Flow 4.)
5. **Application detail** (`/applications/{id}`) — score breakdown + collaboration panel. (Detailed in Flow 4.)
6. **Needs review queue** (`/needs-review`) — HR only. Applications where classification failed; HR picks the right job and re-triggers matching.
7. **Competency profiles** (`/competency-profiles`) — HR only. List + create/edit form.

That's it. No analytics, no settings, no candidate view, no admin panel.

---

## Acceptance criteria

The build is done when all of these pass on a seeded demo dataset:

1. Send a test email with a PDF resume to the configured Postmark address. Within 60 seconds, an `Application` exists, is attached to the right job (confidence ≥ 0.6), and has a `MatchScore`.
2. Send an off-topic email (resume that doesn't match any open job). It lands in `NEEDS_REVIEW` with `jobId = null` and is visible in `/needs-review`.
3. Manual upload via "Add applicant manually" produces the same `MatchScore` shape as the email path.
4. On the job detail page, applicants are sorted by `overallScore` desc by default. Filtering by status works.
5. HR can shortlist 5 candidates with one bulk action; status badges update; an activity event is recorded for each.
6. HM, logged into the same job, sees the 5 shortlisted candidates highlighted. HM bulk-approves 3 of them. Activity log on each shows HR's shortlist event followed by HM's approval event with timestamps and actor names.
7. HR adds a note "Strong communicator, double-check references" on an application. HM, opening the same application, sees the note attributed to HR with a timestamp. HM replies with another note. Both notes appear in chronological order.
8. Clicking "Send to scheduling" on an approved candidate sends them a templated email containing the Calendly link and writes a `scheduling_invited` activity event.
9. Score breakdowns on the application detail page show reasoning text from the LLM for every sub-score. No bare numbers.
10. Re-running matching on an application overwrites the previous `MatchScore` and writes a new `scored` activity event.

---

## Out of scope (do not build, even if tempted)

Candidate-facing portal. Interview scheduling engine. Multi-stage pipelines. Tunable scoring weights. Email templates beyond the auto-acknowledgment and the scheduling invite. Analytics. Bias audits. Duplicate detection. SSO. Mobile-optimized UI. CSV import. Exports. Audit trails beyond `ActivityEvent`. A settings page. Anything that isn't directly proving one of the four concept claims at the top of this doc.

---

## Known risks (call out in demo)

- **LLM scoring drift**: same resume, different score on a re-run. Mitigated by `temperature = 0`, structured output, and storing reasoning. Acknowledge in demo.
- **Resume parsing fails on weird formats** (Pages, image-only PDFs, Google Drive links in body). These land in `NEEDS_REVIEW` — that's the intended graceful failure.
- **Classification false positives** at the boundary (0.6–0.7 confidence). Show confidence on the application detail so HR can sanity-check borderline cases.

---

## Setup notes for Claude Code

1. Scaffold with `create-next-app` (TS, App Router, Tailwind), add Prisma, run initial migration on the schema above.
2. Seed: 2 users (one of each role), 3 open jobs across different departments, 2 competency profiles, 5 applications in varying statuses with mock match scores. The seed should be enough to demo the collaboration flow without needing email setup.
3. **Build order:** auth → schema + seed → jobs CRUD → manual application upload → matching pipeline → job detail (queue) UI → application detail UI → notes + activity → email webhook → scheduling handoff. Email last because it's the most fragile and least demonstrable in unit tests.
4. Every LLM call goes through `lib/llm.ts`. Mock it in tests. During development, log every call's prompt + response to a `LlmCall` table (drop before prod) so we can debug scoring weirdness.
5. Don't add features not in this doc. If something feels missing, surface it as a question — don't build it.
