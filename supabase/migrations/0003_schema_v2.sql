-- Schema v2 — driven by HR product review (May 2025).
--
-- Summary of changes:
--   jobs           — add status lifecycle + timestamps; drop archived_at
--   candidates     — add updated_at; enforce email uniqueness
--   applications   — add job_title snapshot, resume_url, resume_text (moved from
--                    candidates); extend status check; add unique (candidate, job)
--   application_notes      — new table for team reviewer comments
--   job_criteria_history   — new append-only audit log for criteria edits
--   users                  — stubbed for future RBAC (not active until auth lands)
--
-- All column additions use DEFAULT values so existing rows backfill cleanly.
-- Destructive drops (archived_at, candidates.resume_text) happen after backfill.


-- ─────────────────────────────────────────────────────────────────────────────
-- jobs
-- ─────────────────────────────────────────────────────────────────────────────

alter table jobs
  add column if not exists status       text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'closed')),
  add column if not exists published_at timestamptz null,
  add column if not exists paused_at    timestamptz null,
  add column if not exists closed_at    timestamptz null;

-- Backfill: existing rows were all "live" — treat as active, published on creation.
update jobs
set
  status       = 'active',
  published_at = created_at
where status = 'active';

-- Close any rows that were soft-archived via the old archived_at column.
update jobs
set
  status    = 'closed',
  closed_at = archived_at
where archived_at is not null;

alter table jobs drop column if exists archived_at;

create index if not exists jobs_status_idx      on jobs (status);
create index if not exists jobs_created_at_idx  on jobs (created_at desc);


-- ─────────────────────────────────────────────────────────────────────────────
-- candidates
-- ─────────────────────────────────────────────────────────────────────────────

alter table candidates
  add column if not exists updated_at timestamptz not null default now();

-- Enforce email uniqueness (each person = one candidate row).
-- If duplicates exist in the data, this will fail — resolve manually first.
alter table candidates
  add constraint candidates_email_unique unique (email);

-- resume_text moves to applications (per-role resume).
-- We do NOT drop candidates.resume_text here — we keep it as a soft-deprecated
-- column until all writers have been updated to write to applications.resume_text.
-- It will be dropped in a follow-up migration once confirmed.


-- ─────────────────────────────────────────────────────────────────────────────
-- applications
-- ─────────────────────────────────────────────────────────────────────────────

alter table applications
  add column if not exists job_title   text not null default '',
  add column if not exists resume_url  text null,
  add column if not exists resume_text text not null default '',
  add column if not exists updated_at  timestamptz not null default now();

-- Backfill job_title snapshot from the jobs table.
update applications a
set job_title = j.title
from jobs j
where a.job_id = j.id
  and a.job_title = '';

-- Backfill resume_text from the candidate row (best available source for
-- existing applications; new submissions will write directly to applications).
update applications a
set resume_text = c.resume_text
from candidates c
where a.candidate_id = c.id
  and a.resume_text = ''
  and c.resume_text is not null
  and c.resume_text <> '';

-- Extend status check constraint to include full pipeline stages.
-- Drop the old constraint by name (from 0001_init.sql) and add the new one.
alter table applications drop constraint if exists applications_status_check;

alter table applications
  add constraint applications_status_check
  check (status in (
    'new',
    'reviewing',
    'shortlisted',
    'interview_scheduled',
    'interviewed',
    'offered',
    'hired',
    'rejected',
    'withdrawn'
  ));

-- One application per candidate per job.
alter table applications
  add constraint applications_candidate_job_unique
  unique (candidate_id, job_id);

-- New indexes.
create index if not exists applications_status_idx
  on applications (status);

create index if not exists applications_candidate_email_idx
  on applications (candidate_email);

-- Existing indexes are kept (job_code_idx, received_at_idx,
-- job_code_match_score_idx from 0001_init.sql).


-- ─────────────────────────────────────────────────────────────────────────────
-- application_notes
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists application_notes (
  id             text primary key,
  application_id text not null references applications(id) on delete cascade,
  author_email   text not null,
  body           text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists application_notes_application_id_idx
  on application_notes (application_id, created_at desc);


-- ─────────────────────────────────────────────────────────────────────────────
-- job_criteria_history
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists job_criteria_history (
  id              text primary key,
  job_id          text not null references jobs(id) on delete cascade,
  changed_by      text not null,
  changed_at      timestamptz not null default now(),
  criteria_before jsonb not null,
  criteria_after  jsonb not null,
  change_note     text not null default ''
);

create index if not exists job_criteria_history_job_id_idx
  on job_criteria_history (job_id, changed_at desc);


-- ─────────────────────────────────────────────────────────────────────────────
-- users (stubbed — not active until auth is implemented)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists users (
  id         text primary key,
  email      text unique not null,
  name       text not null,
  role       text not null default 'viewer'
    check (role in ('admin', 'manager', 'viewer')),
  created_at timestamptz not null default now()
);
