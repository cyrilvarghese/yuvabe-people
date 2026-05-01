# Yuvabe ATS

A small, opinionated applicant-tracking system for Yuvabe. Inbound applications arrive via email; the system routes each to the right Job, scores the fit against recruiter-confirmed criteria, and surfaces a ranked list of applicants with explainable per-criterion reasoning.

The thesis the product embodies: *"a score without reasoning is not a score."* Every match score the recruiter sees comes with the evidence that produced it.

## Stack at a glance

- **Next.js 16** (App Router, server components by default)
- **TypeScript** strict
- **Tailwind 4** (CSS-first theming via `@theme` in `globals.css`; no `tailwind.config.js`)
- **shadcn/ui** primitives only — no custom UI primitives. Visual identity lives in `className` + design tokens.
- **OpenAI** (`gpt-4o`, `temperature: 0`, `seed: 42`) for JD criteria extraction. Single wrapper at `lib/llm.ts`.
- **Local JSON files** for data (`data/*.json`, with `*.example.json` seeded mock data committed to git). **Future: Supabase Postgres** — the store interface is already designed to migrate cleanly.
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

**Built:** Job creation flow, criteria extraction + editing (3-tier importance with editable dropdown), JSON-backed jobs/candidates/applications stores with mock seeds, full applicant detail with editorial match breakdown, status filtering via URL params, full responsive layouts, contrast-AA-compliant text styling, breadcrumb IA on detail pages.

**Mocked but not real:** 3 jobs, 15 candidates, 21 applications come from `data/*.example.json`. The `data/*.json` (live) files shadow these when populated, but no real intake is wired yet.

**Deferred** (deliberately, see `docs/queries.md` and `docs/prd.md`):
- Email intake via Postmark webhook (the actual receive-and-score flow)
- Shortlist / Reject actions on `/applications/[id]` (currently disabled mock buttons)
- `/jobs/[code]/edit` (currently a disabled CTA)
- Auth (currently no auth — anyone with the URL has full access)
- Migration from JSON store to Supabase

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
- **Borders, not shadows.** Only one shadow exists system-wide (modal / bulk action bar).
- **Warm palette is locked.** `#FAF8F4` bg, `#1A1815` ink, `#8A857B` muted, `#B8553A` terracotta accent. No new color tokens without explicit user request.
- **WCAG AA target.** Use `text-foreground/X` to dim text, never `text-muted-foreground/X` below 80% on informational text.
- **Responsive by default.** Stack on `<md`, scale display sizes, gutter `px-4 md:px-10` etc. See design-system skill §Responsiveness.
- **Tailwind 4, not Tailwind 3.** No `tailwind.config.js`. Theme tokens live in `app/globals.css` `@theme inline`.
- **Mock data is *committed* (`*.example.json`); live data is gitignored (`*.json`).**

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
  jobs-store.ts                Live JSON merge with example fallback
  candidates-store.ts          Read-only candidates store
  applications-store.ts        Read-only applications store with by-job query
  llm.ts                       OpenAI wrapper (single export: extractCriteria)
  parseUpload.ts               PDF / DOCX / TXT parsing
  prompts/
    extractCriteria.v1.ts      Section-anchored prompt for 3-tier importance
components/ui/                 shadcn primitives (button, badge, select, etc.)
data/
  jobs.example.json            Seeded jobs (committed)
  candidates.example.json      Seeded candidates (committed)
  applications.example.json    Seeded applications (committed)
  *.json                       Live data (gitignored, takes precedence over example)
docs/
  prd.md                       Original PRD — full system spec, source of intent
  design-brief.md              Visual design brief — palette, typography, screen specs
  queries.md                   Open business questions for stakeholder review
CONTEXT.md                     Canonical domain glossary
```

## Workflow conventions

- **Business judgment vs. technical** — when ambiguity needs *business* input (policy, naming, workflow, audience), suggest adding to `docs/queries.md`. The pattern + capture format is in `AGENTS.md` below.
- **Fresh session orientation** — start by checking what `data/jobs.json` exists (it shadows seeds), then `pnpm dev` and visit `/jobs`. The mock universe gives you 3 jobs + 21 applications immediately.
- **Before any UI change**: invoke the `yuvabe-design-system` skill. After: invoke `yuvabe-vd-checker`. Don't skip either, especially when adding screens.
- **Pages are server components by default**; only `/jobs/new` is `"use client"` because of upload + dropdown state. Filtering uses URL search params (`?status=...`) so the server still does the work and pages stay bookmarkable.

@AGENTS.md
