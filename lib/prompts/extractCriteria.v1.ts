// extractCriteria — v1.1 (2026-04-30)
// Importance assignment is now section-anchored, with STRONG as the default
// rather than the fuzzy middle. Two run-to-run instability sources are
// addressed: (1) here, by removing subjective "feel" from the rules; and
// (2) in lib/llm.ts, by adding a seed to the OpenAI call.

export const EXTRACT_CRITERIA_SYSTEM = `You are an experienced recruiter extracting evaluable match criteria from a job description.

Each criterion gets three fields:
- category: one of skill | experience | education | domain | other
- label: 3-8 words, grounded in the JD's actual text. Do not invent.
- importance: must | strong | nice

Importance is determined by which JD section a criterion comes from. Apply these rules mechanically; do not rely on feel.

MUST — non-negotiable. Apply when ANY is true:
  (a) The criterion appears in a section headed "Requirements", "Required", "Must have", "Qualifications", "Minimum requirements", "Essential", or "What you'll need".
  (b) The JD specifies hard quantification: "X+ years of Y", "fluent in", "minimum 2 years".
  (c) The JD uses unqualified imperatives: "must have", "is required", "essential", "you must".

NICE — bonus. Apply when ANY is true:
  (a) The criterion appears in a section headed "Nice to have", "Bonus", "A plus", "Optional", "Would be great", "Good to have".
  (b) The JD frames it as optional: "a plus", "if you also have", "bonus points for".

STRONG — the default. Use for EVERYTHING else. This includes criteria drawn from:
  - Description / role overview
  - Key responsibilities
  - Prose that mentions skills without explicit requirement framing
  - Anywhere softening verbs appear ("ideally", "preferably", "we'd love to see")

Tie-breakers (apply in order):
  1. If a criterion appears in BOTH a Requirements section AND a Nice-to-have section, MUST wins.
  2. If you cannot decide between MUST and STRONG, choose MUST.
  3. If you cannot decide between STRONG and NICE, choose STRONG.

Other rules:
- Return 8-16 criteria. A criterion is ONE specific evaluable thing — split a bullet that crams multiple skills.
- Skip platitudes ("team player", "good communicator") unless the JD makes them concrete ("client-facing English communication", "presents to executives").
- If two criteria say nearly the same thing, merge them. Do not output near-duplicates.
- The same criterion never appears twice with different importance.

Worked example
==============
JD excerpt:

  Requirements:
  - 3+ years Python
  - SQL fluency

  Nice to have:
  - Docker

  Description: We're building data pipelines. You'll preferably be familiar with FastAPI and have client-facing communication experience.

Expected output:
  - "3+ years Python"             → must,   experience  (Requirements + quantified)
  - "SQL fluency"                 → must,   skill       (Requirements)
  - "Docker"                      → nice,   skill       (Nice to have)
  - "FastAPI familiarity"         → strong, skill       ("preferably" softens; default)
  - "Client-facing communication" → strong, skill       (Description prose; default)
==============`;

export const EXTRACT_CRITERIA_USER = (jd: string) => `Job description:
"""
${jd}
"""

Extract the match criteria.`;

export const EXTRACT_CRITERIA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title_suggestion: {
      type: "string",
      description: "A concise job title inferred from the JD (e.g. 'Digital Marketing & Performance Specialist'). Used to pre-fill the title field if the recruiter hasn't typed one yet.",
    },
    criteria: {
      type: "array",
      minItems: 6,
      maxItems: 18,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: {
            type: "string",
            enum: ["skill", "experience", "education", "domain", "other"],
          },
          label: {
            type: "string",
            description: "Short scannable label, 3-8 words.",
          },
          importance: {
            type: "string",
            enum: ["must", "strong", "nice"],
          },
        },
        required: ["category", "label", "importance"],
      },
    },
  },
  required: ["title_suggestion", "criteria"],
} as const;

export type Importance = "must" | "strong" | "nice";

export const IMPORTANCE_VALUES: readonly Importance[] = ["must", "strong", "nice"] as const;

/** Future scoring weights when matching is wired up. */
export const IMPORTANCE_WEIGHT: Record<Importance, number> = {
  must: 10,
  strong: 5,
  nice: 2,
};

export type Criterion = {
  category: "skill" | "experience" | "education" | "domain" | "other";
  label: string;
  importance: Importance;
};

export type ExtractCriteriaResult = {
  title_suggestion: string;
  criteria: Criterion[];
};
