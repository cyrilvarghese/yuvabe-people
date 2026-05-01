/**
 * Local JSON-as-database for the prototype. Single file at `data/jobs.json`.
 *
 * The shape of `Job` here IS the shape we'll mirror in Supabase later — keep
 * fields camelCase and add new ones additively so the migration is trivial.
 *
 * NOT atomic. Don't bring this to production. Read-modify-write is fine for
 * a solo dev with one tab open; concurrent writes can lose data.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { customAlphabet } from "nanoid";
import {
  backfillCriterionId,
  generateCriterionId,
  type Criterion,
} from "@/lib/prompts/extractCriteria.v1";

/** Unambiguous alphabet — no 0/O, 1/I/L confusion. ~10^9 unique 6-char codes. */
const codeAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const generateCode = customAlphabet(codeAlphabet, 6);

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "jobs.json");
const EXAMPLE = path.join(DATA_DIR, "jobs.example.json");

export type Job = {
  id: string;
  code: string;          // 6-char nanoid, the [JOB-<code>] token
  title: string;
  description: string;   // raw JD text we passed to the LLM
  criteria: Criterion[]; // editable criteria as confirmed by the recruiter on save
  createdAt: string;     // ISO 8601
  /**
   * Soft-delete marker. When set, the job is hidden from `listJobs()` by
   * default but still resolves via `getJobByCode()` so that existing
   * applications referencing it keep rendering. Reversible.
   */
  archivedAt?: string;
};

type Store = {
  jobs: Job[];
};

async function ensureFile(): Promise<Store> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Read example seed (always — it's mock data we want visible alongside real).
  let exampleJobs: Job[] = [];
  try {
    const raw = await fs.readFile(EXAMPLE, "utf-8");
    exampleJobs = (JSON.parse(raw) as Store).jobs ?? [];
  } catch {
    // No example file — that's fine, we'll just have live data.
  }

  // Read live file (real saved jobs).
  let liveJobs: Job[] = [];
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    liveJobs = (JSON.parse(raw) as Store).jobs ?? [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      // Initialize the live file as empty so subsequent createJob writes work.
      await fs.writeFile(FILE, JSON.stringify({ jobs: [] }, null, 2), "utf-8");
    } else {
      throw err;
    }
  }

  // Merge: live wins on id OR code collision; example fills the rest.
  const liveIds = new Set(liveJobs.map((j) => j.id));
  const liveCodes = new Set(liveJobs.map((j) => j.code));
  const merged = [
    ...liveJobs,
    ...exampleJobs.filter((j) => !liveIds.has(j.id) && !liveCodes.has(j.code)),
  ];

  // Backfill: criteria from older data files (pre-2026-05-01) lack `id`.
  // We assign a deterministic id derived from the label so the same criterion
  // always gets the same id across reads, no matter how many readers race.
  for (const job of merged) {
    for (const c of job.criteria) {
      if (!c.id) c.id = backfillCriterionId(c.label);
    }
  }
  return { jobs: merged };
}

async function writeStore(store: Store): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf-8");
}

/** List all jobs, newest first. Archived jobs are hidden by default. */
export async function listJobs(opts?: { includeArchived?: boolean }): Promise<Job[]> {
  const store = await ensureFile();
  const filtered = opts?.includeArchived
    ? store.jobs
    : store.jobs.filter((j) => !j.archivedAt);
  return [...filtered].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

/**
 * Get one job by its public code. Always resolves regardless of archived
 * state — old applications keep rendering, archived jobs stay viewable.
 */
export async function getJobByCode(code: string): Promise<Job | null> {
  const store = await ensureFile();
  return store.jobs.find((j) => j.code === code) ?? null;
}

/** Archive a job (soft delete). Idempotent — re-archiving updates the timestamp. */
export async function archiveJob(code: string): Promise<Job | null> {
  const store = await ensureFile();
  const job = store.jobs.find((j) => j.code === code);
  if (!job) return null;
  job.archivedAt = new Date().toISOString();
  await writeStore(store);
  return job;
}

/** Restore an archived job. No-op if it wasn't archived. */
export async function unarchiveJob(code: string): Promise<Job | null> {
  const store = await ensureFile();
  const job = store.jobs.find((j) => j.code === code);
  if (!job) return null;
  delete job.archivedAt;
  await writeStore(store);
  return job;
}

/**
 * Criteria arrive here from two paths: the recruiter editor (where each row
 * already has an `id` assigned by extract-criteria/route.ts) and ad-hoc API
 * callers (no id). Either is accepted; the safety net inside createJob fills
 * any gaps.
 */
export type CreateJobInput = {
  title: string;
  description: string;
  criteria: Array<Omit<Criterion, "id"> & { id?: string }>;
};

/** Append a new job, generating a unique 6-char code with up to 5 retries on collision. */
export async function createJob(input: CreateJobInput): Promise<Job> {
  const store = await ensureFile();

  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode();
    if (!store.jobs.some((j) => j.code === candidate)) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    throw new Error("Could not generate a unique job code after 5 attempts");
  }

  // Safety net: any criterion arriving without an id (e.g., manually added by
  // the recruiter in the editor after extraction) gets one fresh nanoid here.
  // Existing ids are preserved.
  const criteriaWithIds: Criterion[] = input.criteria.map((c) => ({
    ...c,
    id: c.id ?? generateCriterionId(),
  }));

  const job: Job = {
    id: crypto.randomUUID(),
    code,
    title: input.title.trim(),
    description: input.description,
    criteria: criteriaWithIds,
    createdAt: new Date().toISOString(),
  };

  store.jobs.push(job);
  await writeStore(store);
  return job;
}
