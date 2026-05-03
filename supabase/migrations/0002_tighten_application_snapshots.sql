-- Stage 4 cleanup — tighten Application's candidate-snapshot columns to NOT NULL.
--
-- These were nullable in the initial schema to mirror the prior TypeScript
-- shape, where the JSON store had a lazy-backfill pattern that filled missing
-- snapshots from candidates-store on first read. Post-Stage 3, all writers
-- (seed script + /api/applications POST handler) populate snapshots at insert
-- time, and there is no more JSON store to leave gaps. Tighten the constraint
-- to match reality.
--
-- The backfill clauses below cover any pre-existing rows that might still
-- carry nulls; they JOIN to candidates and copy the canonical values. After
-- backfill, the SET NOT NULL clauses make new nulls impossible.

-- 1. Backfill any existing nulls from the linked candidate row.
update applications a
set
  candidate_name = coalesce(a.candidate_name, c.name),
  candidate_email = coalesce(a.candidate_email, c.email),
  candidate_location = coalesce(a.candidate_location, c.location),
  candidate_years_of_experience =
    coalesce(a.candidate_years_of_experience, c.years_of_experience)
from candidates c
where a.candidate_id = c.id
  and (
    a.candidate_name is null
    or a.candidate_email is null
    or a.candidate_location is null
    or a.candidate_years_of_experience is null
  );

-- 2. Lock down the columns. From here on, application inserts must include
--    snapshot fields explicitly — the application-side adapter does this.
alter table applications
  alter column candidate_name set not null,
  alter column candidate_email set not null,
  alter column candidate_location set not null,
  alter column candidate_years_of_experience set not null;
