-- Initial schema — three top-level entities mirroring lib/*-store.ts shapes.
--
-- Embedded sub-collections (Job.criteria, Candidate.skills/experience/education,
-- Application.matchBreakdown) are stored as JSONB. The data-modeling rule
-- "data accessed together stored together" is preserved exactly: we never
-- query a sub-row independently of its parent today, so JSONB matches the
-- access pattern. If that ever changes, a JSONB column can be promoted to a
-- child table without a destructive migration (a view + dual-write window
-- bridges the cutover).
--
-- Column naming is snake_case in Postgres; the lib/*-store.ts adapters map
-- to/from the canonical camelCase TypeScript shapes.
--
-- Primary keys are TEXT, not UUID. Two reasons:
--   1. The committed seed data uses semantic string IDs ("c_aisha_khan",
--      "job_aieng_001") that are easier to debug than opaque UUIDs.
--   2. Application code generates UUIDs via crypto.randomUUID() which produces
--      strings — TEXT accepts both shapes without a translation layer.
-- Postgres TEXT-on-TEXT foreign keys behave the same as UUID-on-UUID.

create table jobs (
  id text primary key,
  code text unique not null,
  title text not null,
  description text not null,
  criteria jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  archived_at timestamptz null
);

create table candidates (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null default '',
  location text not null default '',
  summary text not null default '',
  years_of_experience int not null default 0,
  skills jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  links jsonb null,
  resume_text text not null default '',
  created_at timestamptz not null default now()
);

create table applications (
  id text primary key,
  job_id text not null references jobs(id) on delete cascade,
  job_code text not null,                              -- denormalized for fast route lookups
  candidate_id text not null references candidates(id) on delete cascade,
  -- Snapshot fields. Nullable now to match the current TS optional shape;
  -- tightened to NOT NULL in Stage 4 once all writers populate them.
  candidate_name text null,
  candidate_email text null,
  candidate_location text null,
  candidate_years_of_experience int null,
  match_score int not null,
  match_summary text not null default '',
  match_breakdown jsonb not null default '[]'::jsonb,
  cover_letter text not null default '',
  received_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'shortlisted', 'rejected', 'offered'))
);

-- Indexes — one per selective query pattern in the existing store.
-- by-job filter (listApplicationsByJobCode, countApplicationsByJobCode)
create index applications_job_code_idx on applications (job_code);
-- recency sort (listApplications)
create index applications_received_at_idx on applications (received_at desc);
-- by-job + match-score sort (the main job detail page)
create index applications_job_code_match_score_idx
  on applications (job_code, match_score desc);
