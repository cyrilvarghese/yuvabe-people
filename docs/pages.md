# Yuvabe ATS — Page & Feature Map

Each page lists its purpose and all features it should contain.
Use this as a build checklist — one page at a time.

---

## 1. `/jobs` — Jobs List

Browse all posted roles at a glance.

- Active tab — list of all currently live jobs
- Closed tab — archived jobs, browsable for reference
- Each Active row shows: title, published date, application count, match score spread
- Each Closed row shows: title, closed date, application count
- Each Paused row shows: title, paused date, application count (Paused tab between Active and Closed)
- CTA per row: View Applicants
- CTA per row: Edit Criteria → `/jobs/[code]/edit`
- CTA per closed row: Clone as Draft
- CTA per closed row: Re-open
- New Job button → `/jobs/new`

---

## 2. `/jobs/new` — Create Job

Upload a JD, review LLM-extracted criteria, and publish the role.

- JD file upload (PDF / DOCX / TXT)
- LLM criteria extraction on upload
- Editable criteria list — label, category, importance tier
- Importance tier: Must / Preferred / Nice-to-have
- Weight field per criterion (1–5)
- Add / remove criterion rows manually
- Formatted preview step before publishing
- Save as Draft action
- Publish action — moves job to Active status

---

## 3. `/jobs/[code]` — Job Detail + Applicants

Review all applicants for a single role, ranked by fit.

- Job header: title, status, published date, description summary
- Criteria summary — list of Must / Preferred / Nice criteria
- Edit Criteria button → `/jobs/[code]/edit`
- Applicant list sorted high → low by match score
- Score distribution bar — score band + count, e.g. 90–100 (2) · 70–89 (7) · below 70 (12)
- Top N filter: Top 10 / Top 15 / Top 20
- Status filter chips (new / reviewing / shortlisted / etc.)
- Per-row sub-score chips: Must % · Preferred % · Nice %
- Top 3 candidates pinned panel at page top
- Banner alert when criteria were recently edited — with a Re-analyze action to re-score all applications against the updated criteria
- Per-row score-change indicator after re-analysis showing whether the applicant moved up or down

---

## 4. `/jobs/[code]/edit` — Edit Job Criteria

Edit a live job's criteria, weights, and status.

- Editable criteria list — label, category, importance, weight
- Add new criterion row
- Delete criterion row with confirmation
- Change note field — optional reason for the edit
- Save — writes updated criteria and appends a criteria history entry
- Re-analyze all applications — re-runs LLM scoring for every existing application on this job against the updated criteria; overwrites previous scores
- Job status control — toggle Active / Paused / Closed
- Criteria edit history — collapsible audit log: who changed what and when

---

## 5. `/applications` — Global Applicants List

See all applicants across every job in one place.

- List of all applications with applicant name, match score, status
- Job tag on every row — which role the applicant applied for
- Sort high → low by match score
- Status filter
- Job filter — narrow list to a single role
- Top Candidates tab — highest-scored applicants across all active jobs
- Duplicate applicant badge — same person applied to multiple active roles
- Bulk actions: select multiple → move stage / reject / export CSV

---

## 6. `/applications/[id]` — Applicant Detail

Full profile of one applicant — who they are, how they scored, reviewer notes.

### Aside (sticky)

- Name, email, phone, location
- Years of experience
- LinkedIn URL — "Link missing" badge if absent
- Portfolio URL — "Link missing" badge if absent
- GitHub URL — "Link missing" badge if absent
- Resume download link / inline preview panel
- Skills list
- Pipeline status selector: new → reviewing → shortlisted → interview scheduled → interviewed → offered → hired / rejected / withdrawn

### Main — Match Score

- Overall match score + summary paragraph
- Sub-scores by tier: Must % · Preferred % · Nice %
- Per-criterion breakdown rows grouped by tier: label, matched (yes / partial / no), score, evidence sentence

### Main — Work History

- Experience entries: company, title, dates, description
- Education entries: institution, degree, year

### Main — Cover Letter

- Full cover letter text

### Main — Reviewer Notes

- Note thread — all reviewer notes in chronological order
- Add note inline — text field + submit without leaving the page
- Each note shows author and timestamp

### Actions

- Export profile — PDF / CSV with score, breakdown, and contact details

---

## 7. `/admin/users` — User Management _(Admin only)_

Manage who has access to the ATS and what they can do.

- List of all users: name, email, role, date added
- Invite user by email
- Assign or change role: Admin / Manager / Viewer
- Deactivate a user
- Reactivate a deactivated user

---

## Role permissions

### Admin — full access

| Page | Can do |
|---|---|
| `/jobs` | View Active + Closed tabs; create, edit, close, clone, re-open jobs |
| `/jobs/new` | Full access |
| `/jobs/[code]` | View all applicants; change any applicant's status |
| `/jobs/[code]/edit` | Edit criteria, weights, job status; view edit history |
| `/applications` | View all; bulk actions; export |
| `/applications/[id]` | Change status; leave notes; export profile |
| `/admin/users` | Full access |

### Manager — review and progress applicants

| Page | Can do |
|---|---|
| `/jobs` | View Active tab only; View Applicants CTA only |
| `/jobs/new` | No access |
| `/jobs/[code]` | View applicant list and scores; change applicant status |
| `/jobs/[code]/edit` | No access |
| `/applications` | View list; change status; no bulk actions; no export |
| `/applications/[id]` | Change status; leave notes; no export |
| `/admin/users` | No access |

### Viewer — read only

| Page | Can do |
|---|---|
| `/jobs` | View Active tab only |
| `/jobs/new` | No access |
| `/jobs/[code]` | View applicant list and scores; no status changes |
| `/jobs/[code]/edit` | No access |
| `/applications` | View list; no status changes; no bulk actions; no export |
| `/applications/[id]` | Read only — no status change; no notes; no export |
| `/admin/users` | No access |

---

## Build order

| Sprint | Route | Focus |
|---|---|---|
| 1 | `/jobs/[code]/edit` | Criteria editing — most critical gap |
| 1 | `/jobs/new` | Preferred tier + preview step |
| 2 | `/jobs/[code]` | Ranked list, score distribution, Top N, status filter |
| 2 | `/applications/[id]` | Links, resume viewer, score breakdown by tier |
| 3 | `/jobs` | Active / Closed tabs |
| 3 | `/applications` | JD tag, score sort, top candidates tab |
| 4 | All pages | Notes, bulk actions, export, duplicate flag, audit trail |
| 5 | `/admin/users` | User management + role enforcement across all routes |
