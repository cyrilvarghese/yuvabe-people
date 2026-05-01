/**
 * MIGRATION BOUNDARY — data access for Candidate.
 *
 * This file is the only place in the app that reads or writes candidate
 * persistence. All callers go through the exported async functions
 * (listCandidates, getCandidateById, createCandidate). They never see the
 * underlying storage.
 *
 * Today's storage: local JSON file at `data/candidates.json`, with
 * `data/candidates.example.json` as a committed seed fallback when the live
 * file is empty / absent. (See README of pattern at top of jobs-store.ts.)
 *
 * Tomorrow's storage: Supabase `candidates` table. To migrate, replace the
 * `readStore` / `writeStore` bodies with Supabase queries. The exported
 * function signatures, return types, and shape of `Candidate` stay the same —
 * no caller changes required. Field names are camelCase and additive
 * specifically to make that swap mechanical.
 *
 * The example fallback and the read-modify-write race here go away on swap
 * day; Supabase upserts are atomic and there is one source of truth.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "candidates.json");
const EXAMPLE = path.join(DATA_DIR, "candidates.example.json");

export type ExperienceEntry = {
  company: string;
  title: string;
  startDate: string;     // YYYY-MM
  endDate: string;       // YYYY-MM or "present"
  description: string;
};

export type EducationEntry = {
  institution: string;
  degree: string;
  year: number;
};

export type CandidateLinks = {
  linkedin?: string;
  portfolio?: string;
  github?: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;             // 1-2 sentence bio
  yearsOfExperience: number;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  links?: CandidateLinks;
  resumeText: string;          // full parsed resume text
};

type Store = { candidates: Candidate[] };

async function readStore(): Promise<Store> {
  // Try the live file first, fall back to the committed example.
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as Store;
    if (parsed.candidates && parsed.candidates.length > 0) return parsed;
  } catch {
    // fall through to example
  }
  try {
    const raw = await fs.readFile(EXAMPLE, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return { candidates: [] };
  }
}

export async function listCandidates(): Promise<Candidate[]> {
  const store = await readStore();
  return store.candidates;
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  const store = await readStore();
  return store.candidates.find((c) => c.id === id) ?? null;
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf-8");
}

export type CreateCandidateInput = Omit<Candidate, "id">;

export async function createCandidate(
  input: CreateCandidateInput
): Promise<Candidate> {
  const store = await readStore();
  const candidate: Candidate = {
    id: crypto.randomUUID(),
    ...input,
  };
  store.candidates.push(candidate);
  await writeStore(store);
  return candidate;
}
