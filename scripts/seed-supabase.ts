/**
 * Seed Supabase from data/*.example.json.
 *
 * Idempotent: deletes all rows from the three tables (FK cascade handles
 * dependents), then inserts fresh. Safe to re-run any time.
 *
 * Run with: pnpm db:seed
 *   (which expands to: tsx --env-file=.env.local scripts/seed-supabase.ts)
 *
 * NOT a dependency of the app at runtime. Lives in scripts/ so it's never
 * bundled. Uses its own Supabase client because lib/supabase.ts has
 * `import "server-only"` which throws when run from a Node script.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { backfillCriterionId } from "../lib/prompts/extractCriteria.v1";

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error(
    "[seed] Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local."
  );
  process.exit(1);
}

// Accepts both new (`sb_secret_...`) and legacy (`service_role` JWT) keys.
const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DATA_DIR = path.join(process.cwd(), "data");

/* ─────────────────── shape adapters (camelCase → snake_case) ─────────────────── */

type AnyRow = Record<string, unknown>;

function jobToRow(job: AnyRow): AnyRow {
  // Backfill criterion IDs deterministically — same label → same id across runs.
  const criteria = (job.criteria as AnyRow[]).map((c) => ({
    ...c,
    id: c.id ?? backfillCriterionId(c.label as string),
  }));
  return {
    id: job.id,
    code: job.code,
    title: job.title,
    description: job.description,
    criteria,
    created_at: job.createdAt,
    archived_at: job.archivedAt ?? null,
  };
}

function candidateToRow(c: AnyRow): AnyRow {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    location: c.location ?? "",
    summary: c.summary ?? "",
    years_of_experience: c.yearsOfExperience ?? 0,
    skills: c.skills ?? [],
    experience: c.experience ?? [],
    education: c.education ?? [],
    links: c.links ?? null,
    resume_text: c.resumeText ?? "",
  };
}

function applicationToRow(a: AnyRow, candidatesById: Map<string, AnyRow>): AnyRow {
  // Mirror the lazy-backfill that lib/applications-store.ts does on read:
  // populate snapshot fields from the linked candidate if missing in seed.
  const candidate = candidatesById.get(a.candidateId as string);
  return {
    id: a.id,
    job_id: a.jobId,
    job_code: a.jobCode,
    candidate_id: a.candidateId,
    candidate_name: a.candidateName ?? candidate?.name ?? null,
    candidate_email: a.candidateEmail ?? candidate?.email ?? null,
    candidate_location: a.candidateLocation ?? candidate?.location ?? null,
    candidate_years_of_experience:
      a.candidateYearsOfExperience ?? candidate?.yearsOfExperience ?? null,
    match_score: a.matchScore,
    match_summary: a.matchSummary ?? "",
    match_breakdown: a.matchBreakdown ?? [],
    cover_letter: a.coverLetter ?? "",
    received_at: a.receivedAt,
    status: a.status ?? "new",
  };
}

/* ─────────────────── readers ─────────────────── */

async function readJson<T>(filename: string, key: string): Promise<T[]> {
  const full = path.join(DATA_DIR, filename);
  const raw = await fs.readFile(full, "utf-8");
  const parsed = JSON.parse(raw) as Record<string, T[]>;
  return parsed[key] ?? [];
}

/* ─────────────────── main ─────────────────── */

async function main() {
  console.log("[seed] reading data/*.example.json…");
  const jobs = await readJson<AnyRow>("jobs.example.json", "jobs");
  const candidates = await readJson<AnyRow>(
    "candidates.example.json",
    "candidates"
  );
  const applications = await readJson<AnyRow>(
    "applications.example.json",
    "applications"
  );
  console.log(
    `[seed] read ${jobs.length} jobs, ${candidates.length} candidates, ${applications.length} applications`
  );

  // Truncate in dependency order. Postgres FK CASCADE on applications would
  // do this for us, but explicit deletes give clearer error messages.
  console.log("[seed] truncating existing rows…");
  // `neq('id', '')` matches every row; .delete() requires a filter for safety.
  for (const table of ["applications", "candidates", "jobs"] as const) {
    const { error } = await supabase.from(table).delete().neq("id", "");
    if (error) throw new Error(`delete from ${table} failed: ${error.message}`);
  }

  // Insert in dependency order: jobs → candidates → applications.
  console.log("[seed] inserting jobs…");
  const jobRows = jobs.map(jobToRow);
  const { error: jobsErr } = await supabase.from("jobs").insert(jobRows);
  if (jobsErr) throw new Error(`insert jobs failed: ${jobsErr.message}`);

  console.log("[seed] inserting candidates…");
  const candidateRows = candidates.map(candidateToRow);
  const { error: candErr } = await supabase
    .from("candidates")
    .insert(candidateRows);
  if (candErr) throw new Error(`insert candidates failed: ${candErr.message}`);

  console.log("[seed] inserting applications…");
  const candidatesById = new Map<string, AnyRow>(
    candidates.map((c) => [c.id as string, c])
  );
  const applicationRows = applications.map((a) =>
    applicationToRow(a, candidatesById)
  );
  const { error: appsErr } = await supabase
    .from("applications")
    .insert(applicationRows);
  if (appsErr) throw new Error(`insert applications failed: ${appsErr.message}`);

  // Verify counts.
  const counts = await Promise.all(
    (["jobs", "candidates", "applications"] as const).map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) throw new Error(`count ${table} failed: ${error.message}`);
      return [table, count] as const;
    })
  );
  console.log(
    "[seed] done.",
    Object.fromEntries(counts)
  );
}

main().catch((err) => {
  console.error("[seed] FAILED:", err);
  process.exit(1);
});
