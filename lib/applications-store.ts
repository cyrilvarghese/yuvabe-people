/**
 * Local JSON store for applications. Mock data in data/applications.example.json
 * is shadowed by data/applications.json once real applications are persisted
 * (not yet wired). Mirror of the future Supabase `applications` table.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import type { Importance } from "@/lib/prompts/extractCriteria.v1";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "applications.json");
const EXAMPLE = path.join(DATA_DIR, "applications.example.json");

/** Per-criterion analysis produced by future matching pipeline. */
export type CriterionMatch = {
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
  matchScore: number;           // 0–100, rounded
  matchSummary: string;         // one-paragraph editorial overview (LLM "Match summary")
  matchBreakdown: CriterionMatch[];
  coverLetter: string;
  receivedAt: string;           // ISO 8601
  status: ApplicationStatus;
};

type Store = { applications: Application[] };

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as Store;
    if (parsed.applications && parsed.applications.length > 0) return parsed;
  } catch {
    // fall through
  }
  try {
    const raw = await fs.readFile(EXAMPLE, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return { applications: [] };
  }
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

/** Deterministic pseudo-random score 40–95 based on candidate + job pair. */
function mockScore(candidateId: string, jobId: string): number {
  let h = 0;
  const s = candidateId + jobId;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return 40 + (Math.abs(h) % 56);
}

export type CreateApplicationInput = {
  jobId: string;
  jobCode: string;
  candidateId: string;
  coverLetter: string;
  resumeUrl: string;
};

export async function createApplication(
  input: CreateApplicationInput
): Promise<Application> {
  const store = await readStore();
  const application: Application = {
    id: nanoid(),
    jobId: input.jobId,
    jobCode: input.jobCode,
    candidateId: input.candidateId,
    matchScore: mockScore(input.candidateId, input.jobId),
    matchSummary:
      "Application received and queued for review. Match score is a preliminary estimate — full LLM analysis coming soon.",
    matchBreakdown: [],
    coverLetter: input.coverLetter,
    receivedAt: new Date().toISOString(),
    status: "new",
  };
  store.applications.push(application);
  await writeStore(store);
  return application;
}
