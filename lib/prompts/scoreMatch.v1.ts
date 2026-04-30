// scoreMatch — v1.0 (2026-04-30)
// Scores a candidate resume against extracted job criteria.
// Returns per-criterion breakdown + candidate profile fields in one LLM call.

import type { Criterion } from "./extractCriteria.v1";

export const SCORE_MATCH_SYSTEM = `You are a careful, fair recruiter evaluating a candidate's fit for a specific role.

You will be given:
1. A numbered list of job criteria — each prefixed with its importance level (MUST / STRONG / NICE).
2. The candidate's resume text.
3. An optional cover letter.

For EACH criterion you must:
- Search the resume and cover letter for evidence.
- Decide the match level:
    "yes"     — criterion clearly and directly met
    "partial" — relevant evidence exists but incomplete or inferred with gaps
    "no"      — no evidence in the submitted materials
- Write an evidence string (1–2 sentences). Quote or paraphrase from the resume where possible. If absent, write exactly: "Not mentioned."
- Assign a raw score 0–10 (integer):
    10   — fully, explicitly met
    7–9  — strong match with a minor gap
    4–6  — partial match; some relevant evidence, notable gap
    1–3  — weak or tangential mention only
    0    — no evidence at all

Rules:
- Only use what is written in the resume and cover letter. Do not infer skills not stated.
- Do not penalise the candidate for information they chose not to include.
- "partial" requires at least some relevant evidence — it is not the same as "no".
- Echo each criterion_label EXACTLY as given in the numbered list — do not rephrase.

After scoring all criteria, write a match_summary paragraph (3–5 sentences):
- Open with the candidate's name and their single strongest quality for this role.
- Acknowledge the most important gaps honestly and specifically.
- Close with a clear overall recommendation: "strong yes", "yes with reservations", or "no".

Also extract these candidate profile fields from the resume (best effort — use "" or 0 if not found):
- candidate_location         : city / country as a short string
- candidate_years_experience : total professional years as an integer
- candidate_skills           : top 5–8 technical or domain skills as short strings
- candidate_summary          : 1–2 sentence professional bio in third person`;

export const SCORE_MATCH_USER = (
  criteria: Criterion[],
  resumeText: string,
  coverLetter: string
) => {
  const criteriaBlock = criteria
    .map((c, i) => `${i + 1}. [${c.importance.toUpperCase()}] ${c.label}`)
    .join("\n");

  const coverSection = coverLetter.trim()
    ? `\nCover letter:\n"""\n${coverLetter.trim()}\n"""`
    : "";

  return `Job criteria:
${criteriaBlock}

Resume:
"""
${resumeText}
"""${coverSection}

Evaluate the candidate against each criterion above.`;
};

export const SCORE_MATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "candidate_location",
    "candidate_years_experience",
    "candidate_skills",
    "candidate_summary",
    "match_summary",
    "breakdown",
  ],
  properties: {
    candidate_location: { type: "string" },
    candidate_years_experience: { type: "number" },
    candidate_skills: { type: "array", items: { type: "string" } },
    candidate_summary: { type: "string" },
    match_summary: { type: "string" },
    breakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterion_label", "matched", "evidence", "score"],
        properties: {
          criterion_label: { type: "string" },
          matched: { type: "string", enum: ["yes", "partial", "no"] },
          evidence: { type: "string" },
          score: { type: "number" },
        },
      },
    },
  },
} as const;

export type ScoreMatchLLMResult = {
  candidate_location: string;
  candidate_years_experience: number;
  candidate_skills: string[];
  candidate_summary: string;
  match_summary: string;
  breakdown: {
    criterion_label: string;
    matched: "yes" | "partial" | "no";
    evidence: string;
    score: number;
  }[];
};
