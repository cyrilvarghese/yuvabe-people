/**
 * Local JSON store for candidates. Mock data lives in data/candidates.example.json
 * and is shadowed by data/candidates.json once a real candidate is saved (none yet,
 * since intake isn't built). Mirror of the future Supabase `candidates` table —
 * keep field names camelCase and additive.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

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

export async function getCandidateByEmail(
  email: string
): Promise<Candidate | null> {
  const store = await readStore();
  return (
    store.candidates.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    ) ?? null
  );
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf-8");
}

export type CreateCandidateInput = {
  name: string;
  email: string;
  summary: string;
  skills: string[];
};

/** Upsert by email — returns existing candidate if already stored. */
export async function createCandidate(
  input: CreateCandidateInput
): Promise<Candidate> {
  const existing = await getCandidateByEmail(input.email);
  if (existing) return existing;

  const store = await readStore();
  const candidate: Candidate = {
    id: nanoid(),
    name: input.name,
    email: input.email,
    phone: "",
    location: "",
    summary: input.summary,
    yearsOfExperience: 0,
    skills: input.skills,
    experience: [],
    education: [],
    resumeText: "",
  };
  store.candidates.push(candidate);
  await writeStore(store);
  return candidate;
}
