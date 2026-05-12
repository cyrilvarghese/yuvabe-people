# Yuvabe People — Linear Project Setup

---

## Short summary

AI-assisted resume shortlisting and candidate management tool for Yuvabe HR — built to cut screening time and surface the best-fit candidates with explainable match scores.

---

## Description

**What it does**

Yuvabe People is an internal applicant tracking system. When a candidate applies for a role, their resume is parsed and scored against the job's criteria by an AI model. Every match score comes with per-criterion reasoning — so a recruiter can see not just that someone scored 82%, but exactly why.

**Where we are**

A working prototype was delivered in April 2025 and reviewed by the HR team — accessible at [yuvabe-people.vercel.app](https://yuvabe-people.vercel.app/) (login: **admin / password**). The prototype covers: job creation with AI criteria extraction, a ranked applicant list per role, a full candidate profile with match breakdown, and status tracking across a basic pipeline.

HR reviewed the prototype and provided structured feedback across six areas — full notes in [HR Initial Feedback (06/05/2025)](https://docs.google.com/document/d/replace-me):

- Candidate profile missing links (LinkedIn, Portfolio, GitHub) and resume access
- Criteria cannot be edited after a job is posted — critical gap
- No "Preferred" middle tier between Must and Nice-to-have
- Applicant list needs score distribution, tier sub-scores, and Top N filtering
- No Active / Closed separation for jobs
- No reviewer notes, no pipeline stages beyond basic, no role-based access

**Reference documents**

- [HR Initial Feedback (06/05/2025)](https://docs.google.com/document/d/replace-me) — full HR review notes
- [Feature Status (07/05/2026)](https://docs.google.com/document/d/replace-me) — what is built and what is missing, page by page
- [Page & Feature Map](https://docs.google.com/document/d/replace-me) — complete feature plan per page
- [Proposed Schema](https://docs.google.com/document/d/replace-me) — database design

---

## Resources

| Name | Link |
|---|---|
| Live Prototype | https://yuvabe-people.vercel.app/ |
| Proposed Schema | https://docs.google.com/document/d/replace-me |
| HR Initial Feedback (06/05/2025) | https://docs.google.com/document/d/replace-me |
| Page & Feature Map | https://docs.google.com/document/d/replace-me |
| Feature Status (07/05/2026) | https://docs.google.com/document/d/replace-me |

---

## Open decisions — to finalize before Sprint 1 starts

| Decision | Current (prototype) | Options |
|---|---|---|
| Database | Supabase Postgres | Keep Supabase / PlanetScale / Neon |
| Hosting | Vercel | Keep Vercel / Railway / Render |
| Resume file storage | Not saved yet | Supabase Storage / AWS S3 / Cloudflare R2 |
| LLM for scoring | OpenAI GPT-4o | Keep GPT-4o / Claude / Gemini |
| Auth provider | None (no auth yet) | Supabase Auth / Clerk / NextAuth |
