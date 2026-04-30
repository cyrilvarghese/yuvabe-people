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
import type { Criterion } from "@/lib/prompts/extractCriteria.v1";

/** Unambiguous alphabet — no 0/O, 1/I/L confusion. ~10^9 unique 6-char codes. */
const codeAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const generateCode = customAlphabet(codeAlphabet, 6);

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "jobs.json");

export type Job = {
  id: string;
  code: string;          // 6-char nanoid, the [JOB-<code>] token
  title: string;
  description: string;   // raw JD text we passed to the LLM
  criteria: Criterion[]; // editable criteria as confirmed by the recruiter on save
  createdAt: string;     // ISO 8601
};

type Store = {
  jobs: Job[];
};

async function ensureFile(): Promise<Store> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as Store;
  } catch (err) {
    // ENOENT: file doesn't exist yet — create with empty list
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      const empty: Store = { jobs: [] };
      await fs.writeFile(FILE, JSON.stringify(empty, null, 2), "utf-8");
      return empty;
    }
    throw err;
  }
}

async function writeStore(store: Store): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf-8");
}

/** List all jobs, newest first. */
export async function listJobs(): Promise<Job[]> {
  const store = await ensureFile();
  return [...store.jobs].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

/** Get one job by its public code (the [JOB-XXXXXX] token). */
export async function getJobByCode(code: string): Promise<Job | null> {
  const store = await ensureFile();
  return store.jobs.find((j) => j.code === code) ?? null;
}

export type CreateJobInput = {
  title: string;
  description: string;
  criteria: Criterion[];
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

  const job: Job = {
    id: crypto.randomUUID(),
    code,
    title: input.title.trim(),
    description: input.description,
    criteria: input.criteria,
    createdAt: new Date().toISOString(),
  };

  store.jobs.push(job);
  await writeStore(store);
  return job;
}
