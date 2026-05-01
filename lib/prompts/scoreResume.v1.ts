// scoreResume — v1 (2026-05-01)
// Match a parsed resume against a Job's criteria and produce one CriterionMatch
// row per criterion plus an editorial matchSummary. The overall 0-100 matchScore
// is computed deterministically in code from the breakdown using
// IMPORTANCE_WEIGHT — NOT returned by the LLM.
//
// Few-shot examples are lifted verbatim from data/applications.example.json
// (Kabir / Theo / Lakshmi rows) so the editorial voice stays continuous with
// the seeded data the recruiter has already been reading.

import type { Criterion, Importance } from "./extractCriteria.v1";

export const SCORE_RESUME_SYSTEM = `You are matching a candidate's resume against a job's evaluable criteria. For each criterion, return:

- criterionLabel: copy verbatim from input
- importance: copy verbatim from input ("must" / "strong" / "nice")
- matched: "yes" when the resume clearly satisfies the criterion; "partial" when there's some evidence but not full satisfaction (e.g. 3 years where 5+ is required); "no" when absent or contradicted
- score: 0-10. 8-10 = strong yes; 5-7 = borderline / partial; 0-4 = weak / no
- evidence: 4-15 words, citing the resume specifically. Quote numbers, technologies, or role names. For "no", be terse and definitive.

Plus a matchSummary: 2-4 sentences. First sentence: name the candidate + a one-line verdict. Cite trade-offs honestly when the fit is ambiguous. Be honest about misalignment.

Editorial voice — terse, evidence-grounded, no marketing language. Worked examples below.

EXAMPLE — strong fit (B2B marketing role)
Sample breakdown rows:
  - "2-3 years digital marketing" | must | yes | 10 | "5 years B2B SaaS — exceeds the bar."
  - "Hands-on Meta Ads experience" | must | yes | 8 | "Meta Ads in current and prior roles."
  - "Hands-on LinkedIn Ads experience" | must | yes | 10 | "LinkedIn is his deepest channel; ABM experience."
matchSummary: "Kabir is a near-perfect match. Five years of B2B SaaS lead-gen experience with deep LinkedIn Ads expertise (rare). The cost-per-MQL improvement at Roundnet is a concrete, evidenced result."

EXAMPLE — mixed fit (AI Engineer role)
Sample breakdown rows:
  - "5+ years Python" | must | partial | 6 | "3 years professional + research years at KTH; below 5y bar."
  - "PyTorch or TensorFlow" | must | yes | 10 | "PyTorch + JAX in current role; CUDA-level depth."
  - "LLM application experience" | must | yes | 9 | "Inference team at Liquid Compute (coding-assistant product)."
matchSummary: "Theo is research-strong (KTH M.Sc., one NeurIPS workshop paper, CUDA kernel work) but lighter on years and on production MLOps tooling. Trade-off: depth on transformers vs. breadth on production maturity."

EXAMPLE — off-target (junior designer applying to AI Eng role)
Sample breakdown rows:
  - "5+ years Python" | must | no | 0 | "No engineering experience."
  - "PyTorch or TensorFlow" | must | no | 0 | "Not in skills."
  - "Production ML deployment" | must | no | 0 | "Not in scope of design work."
matchSummary: "Lakshmi is a junior product designer; no programming or ML background. This appears to be an off-target application — she may have meant to apply to a different role."

Rules
=====
- Return exactly one row per criterion, in the order the criteria are given.
- Copy criterionLabel and importance verbatim from the input — do not paraphrase or reorder words.
- Prefer ≤12 words for evidence. Use single-quoted short quotes only when the resume has an exact distinguishing phrase (e.g. 'basics', 'expert').
- Canonical phrasings for absence: "Not mentioned." / "Not in skills." / "Not in scope of [their] work." / "Not in resume."
- Never invent details. If you cannot tell from the resume, say so ("Not mentioned in resume.").
- The matchSummary uses the candidate's first name when known, "the candidate" when not.`;

export const SCORE_RESUME_USER = (
  resumeText: string,
  coverLetter: string,
  criteria: Criterion[]
) => {
  const criteriaList = criteria
    .map(
      (c, i) =>
        `${String(i + 1).padStart(2, "0")}. [${c.importance.toUpperCase()}] ${c.label}  (category: ${c.category})`
    )
    .join("\n");
  return `Job criteria (return one row per criterion, in this exact order):
${criteriaList}

Resume:
"""
${resumeText}
"""
${coverLetter
      ? `

Cover letter:
"""
${coverLetter}
"""`
      : ""}

Score the resume against each criterion.`;
};

export const SCORE_RESUME_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    matchSummary: {
      type: "string",
      description: "2-4 sentences. First names the candidate + verdict. Honest about trade-offs.",
    },
    matchBreakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          criterionLabel: { type: "string" },
          importance: {
            type: "string",
            enum: ["must", "strong", "nice"],
          },
          matched: {
            type: "string",
            enum: ["yes", "partial", "no"],
          },
          score: {
            type: "number",
            minimum: 0,
            maximum: 10,
          },
          evidence: { type: "string" },
        },
        required: ["criterionLabel", "importance", "matched", "score", "evidence"],
      },
    },
  },
  required: ["matchSummary", "matchBreakdown"],
} as const;

export type ScoreResumeBreakdownRow = {
  criterionLabel: string;
  importance: Importance;
  matched: "yes" | "partial" | "no";
  score: number;
  evidence: string;
};

export type ScoreResumeResult = {
  matchSummary: string;
  matchBreakdown: ScoreResumeBreakdownRow[];
};
