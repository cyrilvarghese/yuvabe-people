# Yuvabe People — MVP Scope

The MVP is the minimum build needed to hand a working, usable product to HR. Everything already in the prototype carries forward. The additions below are what makes it genuinely usable — either critical gaps HR flagged, or easy wins where the data already exists and only the UI is missing.

---

## Already built

| Page | What works |
|---|---|
| `/jobs` | Job list, application count per row, View Applicants button |
| `/jobs/new` | JD file upload, AI criteria extraction, editable criteria list (Must / Nice tiers) |
| `/jobs/[code]` | Job detail, ranked applicant list, status filter chips |
| `/applications` | Global applicants list, status filter |
| `/applications/[id]` | Full profile — name, email, location, experience, skills, work history, education, cover letter, match score, match summary, per-criterion breakdown, status selector |

---

## To build for MVP

### Critical gaps

| # | Feature | Page |
|---|---|---|
| 1 | **Preferred importance tier** (Must / Preferred / Nice) — third tier HR specifically asked for; affects scoring accuracy | `/jobs/new` + `/jobs/[code]/edit` |
| 2 | **Edit Criteria page** — edit labels and importance, add or remove criteria, save; wires up the currently dead Edit Criteria button | `/jobs/[code]/edit` (new page) |
| 3 | **Wire Edit Criteria button** — connect existing button on jobs list and job detail to the new edit page | `/jobs` + `/jobs/[code]` |
| 4 | **Candidate links** — LinkedIn, Portfolio, GitHub with "Link missing" badge when absent | `/applications/[id]` |
| 5 | **Resume access** — download link or inline viewer for the uploaded resume file | `/applications/[id]` |
| 6 | **Save as Draft / Publish flow** — save a job as draft without it going live; explicit Publish action moves it to active | `/jobs/new` |
| 7 | **Job preview before publishing** — formatted preview step so the creator can review criteria before the job goes live | `/jobs/new` |

### Easy wins — data already exists, UI only

| # | Feature | Page |
|---|---|---|
| 6 | **Job label on every row** — show which role each applicant applied for (`job_title` already stored) | `/applications` |
| 7 | **Sort by match score** — high to low sort on the global applicants list | `/applications` |
| 8 | **Filter by job** — dropdown to narrow the global list to one role | `/applications` |
| 9 | **Full pipeline stages** — extend status selector to all 9 stages: new → reviewing → shortlisted → interview scheduled → interviewed → offered → hired / rejected / withdrawn | `/applications/[id]` |
| 10 | **Published date on job row** — show when each job went live (`published_at` already stored) | `/jobs` |
| 11 | **Active / Paused / Closed tabs** — separate jobs by status instead of one flat list (`status` already stored) | `/jobs` |
| 12 | **Clone closed job as Draft** — copy title and criteria into a new draft job | `/jobs` |
| 13 | **Re-open a closed job** — set a closed job back to active | `/jobs` |
| 14 | **Top N filter** — Top 10 / 15 / 20 quick filter on the applicant list (slice of the already-sorted list) | `/jobs/[code]` |
| 15 | **Bulk actions** — select multiple applicants → move stage / reject | `/applications` |

---

## Deferred — post-MVP

These are all valid HR requests. The schema already has the columns ready. They are out of the MVP because they require scoring logic changes, background processing, or a separate auth system.

| Feature | Reason deferred |
|---|---|
| Weight field per criterion (1–5) | Needs the scoring formula to be updated — not just storing the value |
| Re-analyze all applications after criteria edit | Requires background job processing and `scored_at` tracking |
| Score-change indicator after re-analysis | Only meaningful once re-analysis exists; needs `previous_match_score` |
| Stale score banner | Depends on re-analyze flow being built first |
| Criteria edit history / audit log | Table is ready in schema; UI is out of MVP scope |
| Score distribution bar | Display feature; not blocking usability |
| Tier sub-scores per row (Must % · Preferred % · Nice %) | Needs `must_score` / `preferred_score` / `nice_score` to be populated on scoring |
| Sub-scores by tier on applicant profile | Same dependency as above |
| Top 3 pinned candidates panel | Display feature; not blocking usability |
| Reviewer notes / comment thread | Table is ready in schema; UI is out of MVP scope |
| Bulk actions (move stage / reject / export) | High UI complexity; post-MVP |
| Export profile (PDF / CSV) | Post-MVP |
| Duplicate applicant flag | Post-MVP |
| Role-based access (Admin / Manager / Viewer) | Single admin role for MVP; no RBAC screens needed yet |
| User Management (`/admin/users`) | Depends on auth implementation |
