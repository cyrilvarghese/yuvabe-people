# Yuvabe ATS

A small, opinionated applicant-tracking system for Yuvabe. Inbound applications arrive via email; the system routes each to the right Job, scores the fit against recruiter-confirmed criteria, and surfaces a ranked list of applicants with explainable per-criterion reasoning.

The thesis the product embodies: *"a score without reasoning is not a score."* Every match score the recruiter sees comes with the evidence that produced it.

## Stack at a glance

- **Next.js 16** (App Router, server components by default)
- **TypeScript** strict
- **Tailwind 4** (CSS-first theming via `@theme` in `globals.css`; no `tailwind.config.js`)
- **shadcn/ui** primitives only — no custom UI primitives. Visual identity lives in `className` + design tokens.
- **OpenAI** (`gpt-4o`, `temperature: 0`, `seed: 42`) for JD criteria extraction. Single wrapper at `lib/llm.ts`.
- **Supabase Postgres** for data. Three tables (`jobs`, `candidates`, `applications`) with JSONB columns for embedded sub-collections (criteria, skills, experience, education, matchBreakdown). Server-only client at `lib/supabase.ts` uses the new-format secret key (`sb_secret_...`); RLS is currently off (auth is a future plan). Schema lives in `supabase/migrations/*.sql`. The committed mock seed in `data/*.example.json` loads via `pnpm db:seed`.
- **File parsing**: `unpdf` (PDF), `mammoth` (DOCX), native UTF-8 (TXT/MD). See `lib/parseUpload.ts`.
- **Fonts**: Newsreader (display/italic), Geist (UI/body), Geist Mono (numerics/captions). Wired in `app/layout.tsx` via `next/font/google`.

## Domain in one paragraph

A **Job** has many **Applications**. Each Application has one **Candidate** (the person) and one **Match Score** (LLM-computed: per-criterion `matched: yes | partial | no` plus 0–10 score plus an evidence sentence). UI label is "Applicants" because recruiters reason about people, not events; the data model still treats Application and Candidate as distinct entities. See `CONTEXT.md` for the canonical glossary.

## Pages

| Route | Purpose | Type |
|---|---|---|
| `/` | Redirects to `/jobs` | Page |
| `/jobs` | List of jobs · counts · two CTAs per row (View applicants, Edit-disabled) | Server |
| `/jobs/new` | JD upload → LLM extracts criteria → recruiter edits Must/Strong/Nice → save | Client |
| `/jobs/[code]` | Job detail + ranked applicants list, status filter chips (URL-driven `?status=...`) | Server |
| `/applications` | Cross-job applicants list, status filtered | Server |
| `/applications/[id]` | Full applicant profile + per-criterion match breakdown + cover letter + resume | Server |

API routes (no UI): `POST /api/extract-criteria` (JD file → LLM), `GET/POST /api/jobs` (jobs CRUD).

## What's built vs. what's deferred

**Built:** Job creation flow, criteria extraction + editing (3-tier importance with editable dropdown), Supabase-backed jobs/candidates/applications stores, full applicant detail with editorial match breakdown, status filtering via URL params + status toggle group on detail page, full responsive layouts, contrast-AA-compliant text styling, breadcrumb IA on detail pages, real apply submission pipeline (resume upload → LLM parse + score → Postgres write).

**Seeded mock universe:** 3 jobs, 15 candidates, 21 applications loaded from `data/*.example.json` via `pnpm db:seed`.

**Deferred** (deliberately, see `docs/queries.md` and `docs/prd.md`):
- Email intake via Postmark webhook (the actual receive-and-score flow)
- `/jobs/[code]/edit` (currently a disabled CTA)
- Auth + Row-Level Security (currently no auth — service-role key, anyone with the URL has full access)
- Realtime subscriptions for live status updates across recruiters

## Skills loaded automatically

| Skill | When it activates | Read it from |
|---|---|---|
| `yuvabe-design-system` | Before writing/editing any `.tsx` in `app/` or `components/`, or changing `globals.css` tokens. **Apply this proactively.** | `.claude/skills/yuvabe-design-system/SKILL.md` |
| `yuvabe-interaction-design` | Before writing any list, table, card-grid, or surface that forks into a detail view. Before adding/removing row actions. **Apply this proactively.** | `.claude/skills/yuvabe-interaction-design/SKILL.md` |
| `yuvabe-vd-checker` | After completing a screen, when user says "VD check", "audit this screen", "is this on-brand?". | `.claude/skills/yuvabe-vd-checker/SKILL.md` |

The three skills divide the design surface: **design-system** governs *how a single surface looks*, **interaction-design** governs *how surfaces compose into flows*, and **vd-checker** *verifies what was built* against the visual system. Design-system + interaction-design are generative (apply before writing); vd-checker is verifying (apply after).

## Locked constraints

These are non-negotiable. If a request seems to conflict with one, surface it before silently overriding.

- **shadcn primitives only — no custom UI primitives.** Visual identity in `className` and `globals.css` tokens, never new components in `components/`.
- **Borders, not shadows.** Two shadows exist, and only two: the *heavy* shadow on modals + the bulk-action bar, and the *hairline* `--shadow-hover` (`0 1px 2px rgb(26 24 21 / 0.04)`) used for hover-lift on row-as-link surfaces and clickable cards (NOT buttons). No third — never reach for `shadow-sm`/`shadow-md`/etc. Everywhere else: borders.
- **Warm palette is locked.** `#FAF8F4` bg, `#1A1815` ink, `#8A857B` muted, `#B8553A` terracotta accent. No new color tokens without explicit user request.
- **WCAG AA target.** Use `text-foreground/X` to dim text, never `text-muted-foreground/X` below 80% on informational text.
- **Responsive by default.** Stack on `<md`, scale display sizes, gutter `px-4 md:px-10` etc. See design-system skill §Responsiveness.
- **Tailwind 4, not Tailwind 3.** No `tailwind.config.js`. Theme tokens live in `app/globals.css` `@theme inline`.
- **Seed data is *committed* (`data/*.example.json`); it loads into Supabase via `pnpm db:seed`.** No live JSON shadows — Postgres is the only runtime store.

## File map

```
app/
  jobs/
    page.tsx                   List of jobs
    new/page.tsx               Create-a-job (LLM extraction, client component)
    [code]/page.tsx            Job detail + applicants
    _components/nav-tab.tsx    Nav tab (client)
  applications/
    page.tsx                   Cross-job applicants list
    [id]/page.tsx              Full applicant detail (sticky aside + scrolling main)
  api/
    extract-criteria/route.ts  Multipart upload → parse → LLM → criteria
    jobs/route.ts              POST creates job, GET lists jobs
  globals.css                  Palette tokens + grain texture + animations
  layout.tsx                   Font wiring (Geist + Geist Mono + Newsreader)
lib/
  supabase.ts                  Server-only Supabase client + dev-mode query logger
  jobs-store.ts                Jobs CRUD against Supabase
  candidates-store.ts          Candidates CRUD against Supabase
  applications-store.ts        Applications CRUD against Supabase
  llm.ts                       OpenAI wrapper (single export: extractCriteria)
  parseUpload.ts               PDF / DOCX / TXT parsing
  prompts/
    extractCriteria.v1.ts      Section-anchored prompt for 3-tier importance
components/ui/                 shadcn primitives (button, badge, select, etc.)
supabase/
  migrations/
    0001_init.sql              Initial schema (3 tables, JSONB sub-collections)
    0002_tighten_application_snapshots.sql  Stage 4 — NOT NULL on snapshot fields
scripts/
  seed-supabase.ts             Reads data/*.example.json → inserts into Supabase
data/
  jobs.example.json            Seed jobs (committed; loaded via pnpm db:seed)
  candidates.example.json      Seed candidates (committed)
  applications.example.json    Seed applications (committed)
docs/
  prd.md                       Original PRD — full system spec, source of intent
  design-brief.md              Visual design brief — palette, typography, screen specs
  queries.md                   Open business questions for stakeholder review
  data-modeling.md             Schema design rationale + access-pattern rules
CONTEXT.md                     Canonical domain glossary
```

## Workflow conventions

- **Business judgment vs. technical** — when ambiguity needs *business* input (policy, naming, workflow, audience), suggest adding to `docs/queries.md`. The pattern + capture format is in `AGENTS.md` below.
- **Fresh session orientation** — confirm `SUPABASE_URL` + `SUPABASE_SECRET_KEY` are set in `.env.local`, run `pnpm db:seed` if Postgres is empty, then `pnpm dev` and visit `/jobs`. The mock universe gives you 3 jobs + 15 candidates + 21 applications immediately.
- **Before any UI change**: invoke the `yuvabe-design-system` skill. After: invoke `yuvabe-vd-checker`. Don't skip either, especially when adding screens.
- **Pages are server components by default**; only `/jobs/new` is `"use client"` because of upload + dropdown state. Filtering uses URL search params (`?status=...`) so the server still does the work and pages stay bookmarkable.

@AGENTS.md
