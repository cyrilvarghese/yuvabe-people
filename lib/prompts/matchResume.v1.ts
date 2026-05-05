// matchResume — v1.0 (2026-04-30)

import type { Criterion } from "./extractCriteria.v1";

export const MATCH_RESUME_SYSTEM = `You are an expert recruiter evaluating a candidate's resume against specific job criteria.

For EACH criterion provided, produce:
- criterionLabel: copy the label exactly as given — do not paraphrase
- matched: "yes" if clearly demonstrated, "partial" if suggested but incomplete, "no" if absent
- evidence: one or two sentences quoting or paraphrasing the resume. If "no", state what is missing.
- score: integer 0–10
    10  → exceptional, clearly exceeds the criterion
    8–9 → clearly meets it
    5–7 → partially meets or can be inferred
    1–4 → weak, indirect evidence
    0   → not present

Also extract from the resume:
- candidateName: full name as written (required)
- candidateEmail: email address, or "" if not found
- candidatePhone: phone number, or "" if not found
- candidateLocation: city / country, or "" if not found
- candidateSkills: up to 15 of the most specific technical or domain skills listed or clearly demonstrated

Finally, write a matchSummary: 2–3 sentence editorial overview of overall fit, written for a recruiter skimming a shortlist.

Rules:
- Evaluate every criterion — do not skip any.
- Copy criterion labels verbatim.
- Be evidence-based. Quote directly when possible.
- Do not invent evidence. If it is not in the resume, say so.`;

export const MATCH_RESUME_USER = (criteria: Criterion[], resumeText: string) =>
  `Job criteria (evaluate each in order):
${criteria.map((c, i) => `${i + 1}. [${c.importance.toUpperCase()}] ${c.label} (${c.category})`).join("\n")}

Resume:
"""
${resumeText}
"""`.trim();

export const MATCH_RESUME_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidateName:     { type: "string" },
    candidateEmail:    { type: "string" },
    candidatePhone:    { type: "string" },
    candidateLocation: { type: "string" },
    candidateSkills: {
      type: "array",
      items: { type: "string" },
    },
    matchSummary: { type: "string" },
    breakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          criterionLabel: { type: "string" },
          matched:        { type: "string", enum: ["yes", "partial", "no"] },
          evidence:       { type: "string" },
          score:          { type: "integer", minimum: 0, maximum: 10 },
        },
        required: ["criterionLabel", "matched", "evidence", "score"],
      },
    },
  },
  required: [
    "candidateName",
    "candidateEmail",
    "candidatePhone",
    "candidateLocation",
    "candidateSkills",
    "matchSummary",
    "breakdown",
  ],
} as const;

export type MatchResumeResult = {
  candidateName:     string;
  candidateEmail:    string;
  candidatePhone:    string;
  candidateLocation: string;
  candidateSkills:   string[];
  matchSummary:      string;
  breakdown: Array<{
    criterionLabel: string;
    matched:        "yes" | "partial" | "no";
    evidence:       string;
    score:          number;
  }>;
};
