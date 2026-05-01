/**
 * MIGRATION BOUNDARY — data access for Application + CriterionMatch.
 *
 * This file is the only place in the app that reads or writes application
 * persistence. All callers go through the exported async functions
 * (listApplications, listApplicationsByJobCode, getApplicationById,
 * countApplicationsByJobCode, createApplication). They never see the
 * underlying storage.
 *
 * Today's storage: local JSON file at `data/applications.json`, with
 * `data/applications.example.json` as a committed seed fallback when the live
 * file is empty / absent. (See README of pattern at top of jobs-store.ts.)
 *
 * Tomorrow's storage: Supabase `applications` table (one row per Application,
 * with matchBreakdown likely persisted as JSONB or split into a child
 * `criterion_matches` table). To migrate, replace the `readStore` / `writeStore`
 * bodies with Supabase queries; the exported function signatures, return
 * types, and shapes of `Application` + `CriterionMatch` stay the same — no
 * caller changes required. Field names are camelCase and additive specifically
 * to make that swap mechanical.
 *
 * The denormalised `jobCode` on Application can stay (cheap direct-route
 * lookups without a join) or be retired in favour of a `jobs(code)` join —
 * either way, no caller change.
 *
 * The example fallback and the read-modify-write race here go away on swap
 * day; Supabase upserts are atomic and there is one source of truth.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Importance } from "@/lib/prompts/extractCriteria.v1";
import { getCandidateById } from "@/lib/candidates-store";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "applications.json");
const EXAMPLE = path.join(DATA_DIR, "applications.example.json");

/** Per-criterion analysis produced by future matching pipeline. */
export type CriterionMatch = {
  /**
   * Reference back to the parent Job's `Criterion.id`. Optional because
   * matchBreakdown rows on data created before 2026-05-01 don't have this.
   * When present, lets the UI resolve the canonical criterion even if the
   * recruiter has since renamed the label. The denormalized `criterionLabel`
   * stays as a read-convenience and migration safety net.
   */
  criterionId?: string;
  criterionLabel: string;
  importance: Importance;       // copied from the job's criteria for display convenience
  matched: "yes" | "partial" | "no";
  evidence: string;             // sentence quoted/summarized from the resume / cover letter
  /** 0–10 contribution to overall score before importance weighting. */
  score: number;
};

export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "offered";

export type Application = {
  id: string;
  jobId: string;                // FK → Job.id
  jobCode: string;              // denormalized for direct route lookups
  candidateId: string;          // FK → Candidate.id
  /**
   * Snapshots of the parent Candidate's identifying fields, written at
   * createApplication time. Listing pages (`/applications`, `/jobs/[code]`)
   * read these directly so they don't have to fan out a candidates query
   * just to render rows. The full Candidate doc is still fetched on
   * /applications/[id] where the rich profile is shown.
   *
   * Optional in the type to keep older seeded rows parseable; readStore
   * lazily backfills any missing snapshots from candidates-store on first read.
   */
  candidateName?: string;
  candidateEmail?: string;
  candidateLocation?: string;
  candidateYearsOfExperience?: number;
  matchScore: number;           // 0–100, rounded
  matchSummary: string;         // one-paragraph editorial overview (LLM "Match summary")
  matchBreakdown: CriterionMatch[];
  coverLetter: string;
  receivedAt: string;           // ISO 8601
  status: ApplicationStatus;
};

type Store = { applications: Application[] };

async function readStore(): Promise<Store> {
  let store: Store | null = null;
  let loadedFromLive = false;

  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as Store;
    if (parsed.applications && parsed.applications.length > 0) {
      store = parsed;
      loadedFromLive = true;
    }
  } catch {
    // fall through to example
  }

  if (!store) {
    try {
      const raw = await fs.readFile(EXAMPLE, "utf-8");
      store = JSON.parse(raw) as Store;
    } catch {
      store = { applications: [] };
    }
  }

  // Lazy backfill: join to candidates-store once for any application missing
  // its candidate snapshot fields, then persist back to FILE so subsequent
  // reads are O(1). Idempotent — converges to "every row has snapshots".
  let mutated = false;
  for (const app of store.applications) {
    if (
      app.candidateName !== undefined &&
      app.candidateEmail !== undefined &&
      app.candidateLocation !== undefined &&
      app.candidateYearsOfExperience !== undefined
    ) {
      continue;
    }
    const c = await getCandidateById(app.candidateId);
    if (!c) continue;
    if (app.candidateName === undefined) {
      app.candidateName = c.name;
      mutated = true;
    }
    if (app.candidateEmail === undefined) {
      app.candidateEmail = c.email;
      mutated = true;
    }
    if (app.candidateLocation === undefined) {
      app.candidateLocation = c.location;
      mutated = true;
    }
    if (app.candidateYearsOfExperience === undefined) {
      app.candidateYearsOfExperience = c.yearsOfExperience;
      mutated = true;
    }
  }

  // Persist if we enriched anything. Writes always go to FILE — if we loaded
  // from EXAMPLE on a fresh clone, this also "promotes" the seed data into a
  // live file (matching the existing convention that live shadows example).
  if (mutated) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf-8");
  }

  // `loadedFromLive` is currently informational only; keeping it as a hook
  // for future logic that may want to differentiate (e.g. cache-busting).
  void loadedFromLive;
  return store;
}

export async function listApplications(): Promise<Application[]> {
  const store = await readStore();
  return [...store.applications].sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt)
  );
}

/** All applications for a given job, sorted by match score desc. */
export async function listApplicationsByJobCode(
  jobCode: string
): Promise<Application[]> {
  const store = await readStore();
  return store.applications
    .filter((a) => a.jobCode === jobCode)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getApplicationById(
  id: string
): Promise<Application | null> {
  const store = await readStore();
  return store.applications.find((a) => a.id === id) ?? null;
}

export async function countApplicationsByJobCode(
  jobCode: string
): Promise<number> {
  const store = await readStore();
  return store.applications.filter((a) => a.jobCode === jobCode).length;
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf-8");
}

export type CreateApplicationInput = Omit<Application, "id" | "receivedAt">;

export async function createApplication(
  input: CreateApplicationInput
): Promise<Application> {
  const store = await readStore();
  const application: Application = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    ...input,
  };
  store.applications.push(application);
  await writeStore(store);
  return application;
}

/**
 * Update an Application's status (Reject, Shortlist, etc). Returns the
 * updated record, or null if not found. The status itself is the only
 * mutation; everything else (matchScore, breakdown, snapshots) stays.
 */
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<Application | null> {
  const store = await readStore();
  const application = store.applications.find((a) => a.id === id);
  if (!application) return null;
  application.status = status;
  await writeStore(store);
  return application;
}
