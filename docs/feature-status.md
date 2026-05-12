# Yuvabe ATS — Feature Status

_Based on HR product review · May 2025_

Shows what is live today, what is missing, and what data changes are needed.

---

## Page 1 · Jobs List `/jobs`

| Feature | Status |
|---|---|
| List of all jobs | ✅ Done |
| Application count per job | ✅ Done |
| View Applicants button per row | ✅ Done |
| Edit Criteria button per row | ❌ Button exists but does nothing |
| Active / Paused / Closed tabs | ❌ Not built — all jobs shown in one flat list |
| Published / paused / closed date on each row | ❌ Not shown |
| Match score spread per row | ❌ Not shown |
| Clone a closed job as a new draft | ❌ Not built |
| Re-open a closed job | ❌ Not built |

---

## Page 2 · Create Job `/jobs/new`

| Feature | Status |
|---|---|
| Upload a JD file (PDF / Word / Text) | ✅ Done |
| AI extracts criteria from the JD | ✅ Done |
| Edit the extracted criteria list | ✅ Done |
| Must / Nice-to-have importance tiers | ✅ Done |
| **Preferred** tier (between Must and Nice) | ❌ Not built — only two tiers exist today |
| Assign a weight to each criterion | ❌ Not built |
| Preview the job before publishing | ❌ Not built — saves immediately |
| Save as Draft without publishing | ❌ Not built — saves as live immediately |
| Explicit Publish action | ❌ Not built |

---

## Page 3 · Job Detail + Applicants `/jobs/[code]`

| Feature | Status |
|---|---|
| Job title and criteria list | ✅ Done |
| Ranked applicant list with match scores | ✅ Done |
| Status filter (shortlisted / rejected / etc.) | ✅ Done |
| Edit Criteria button | ❌ Not wired up |
| Score distribution bar (e.g. 90–100: 2 · 70–89: 7) | ❌ Not built |
| Top 10 / 15 / 20 quick filter | ❌ Not built |
| Per-applicant sub-scores by tier (Must % · Preferred % · Nice %) | ❌ Not built |
| Top 3 candidates pinned at the top | ❌ Not built |
| Alert when criteria were recently edited | ❌ Not built |
| Re-analyze button to refresh all scores after a criteria change | ❌ Not built |
| Score-change indicator per applicant after re-analysis | ❌ Not built |

---

## Page 4 · Edit Job Criteria `/jobs/[code]/edit`

| Feature | Status |
|---|---|
| **This page does not exist yet** | ❌ Not built |
| Edit criteria labels, importance, weight | ❌ |
| Add or remove criteria | ❌ |
| Log a note explaining the change | ❌ |
| Re-analyze all applicants with updated criteria | ❌ |
| Toggle job status (Active / Paused / Closed) | ❌ |
| View history of past criteria edits | ❌ |

---

## Page 5 · All Applicants `/applications`

| Feature | Status |
|---|---|
| List of all applicants across all jobs | ✅ Done |
| Status filter | ✅ Done |
| Job label on each row (which role they applied for) | ❌ Not shown |
| Sort by match score | ❌ Not built |
| Filter by job | ❌ Not built |
| Top Candidates tab (highest scores across all jobs) | ❌ Not built |
| Flag when the same person applied to multiple roles | ❌ Not built |
| Bulk actions (move stage / reject / export selected) | ❌ Not built |

---

## Page 6 · Applicant Profile `/applications/[id]`

| Feature | Status |
|---|---|
| Name, email, location, years of experience | ✅ Done |
| Skills list | ✅ Done |
| Work history and education | ✅ Done |
| Cover letter | ✅ Done |
| Overall match score and summary | ✅ Done |
| Per-criterion match breakdown | ✅ Done |
| Pipeline status selector | ✅ Done (limited stages) |
| LinkedIn URL with "Link missing" badge | ❌ Not shown |
| Portfolio URL with "Link missing" badge | ❌ Not shown |
| GitHub URL | ❌ Not shown |
| Resume download link or inline viewer | ❌ File is not surfaced after upload |
| Sub-scores by tier (Must % · Preferred % · Nice %) | ❌ Not built |
| Criteria breakdown grouped by tier | ❌ All criteria shown in a flat list |
| Full pipeline stages (interview scheduled → interviewed → hired / withdrawn) | ❌ Only 5 basic stages exist |
| Reviewer notes — team-visible comment thread | ❌ Not built |
| Export applicant profile as PDF or CSV | ❌ Not built |

---

## Page 7 · User Management `/admin/users`

| Feature | Status |
|---|---|
| **This page does not exist yet** | ❌ Not built |
| List of users with name, email, role | ❌ |
| Invite a user by email | ❌ |
| Assign or change a user's role (Admin / Manager / Viewer) | ❌ |
| Deactivate / reactivate a user | ❌ |

---

## Data & Schema — what needs to change

These are behind-the-scenes changes to how information is stored. No visible change to existing screens, but required before the new features above can be built.

| Area | Current state | Change needed |
|---|---|---|
| Job status | Jobs have no status — no way to mark a job as Draft, Paused, or Closed | Add a status field with Draft / Active / Paused / Closed and the date each status was set |
| Criteria importance tiers | Only Must and Nice-to-have are stored | Add Preferred as a third tier |
| Criteria weight | No weight stored per criterion | Add a weight field (1–5) per criterion |
| Criteria history | No record of who changed criteria or when | Add an audit log — one entry per edit, recording before and after |
| Resume storage | The resume text is stored against the person, not the application | Move it to the application so a person can submit a different resume for each role they apply to |
| Resume file link | File is uploaded but the link is not saved | Save the file link on the application so it can be shown on the profile |
| Job title on applications | Fetching the job title requires a separate database lookup | Store the job title directly on the application row for fast list loading |
| Application pipeline stages | Only 5 stages: new / reviewing / shortlisted / rejected / offered | Extend to: new → reviewing → shortlisted → interview scheduled → interviewed → offered → hired / rejected / withdrawn |
| Reviewer notes | Nowhere to store team comments on an applicant | New notes table — one note per reviewer per application |
| Users and roles | No user accounts exist | New users table with Admin / Manager / Viewer roles |

---

## Summary

| | Count |
|---|---|
| Features already live | **16** |
| Features not yet built | **38** |
| Pages that do not exist yet | **2** (Edit Job · User Management) |
| Schema / data changes needed | **10** |
