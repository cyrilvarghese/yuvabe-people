// parseResume — v1 (2026-05-01)
// Resume text → structured Candidate profile. Output fields exactly match
// `Candidate` in lib/candidates-store.ts (minus id/name/email/resumeText, which
// are supplied separately by the caller).
//
// Convention: when a field cannot be determined from the resume, return the
// neutral empty value — "" for strings, 0 for numbers, [] for arrays. Do NOT
// invent or hallucinate. The downstream UI handles empty values gracefully.

export const PARSE_RESUME_SYSTEM = `You are parsing a resume into a structured candidate profile. Be faithful to the resume; do not invent information that is not present.

Output fields:
- phone: phone number as written in the resume, or "" if absent.
- location: "City, Country" or "City, Region" if available. Use "City, IN" / "City, US" style if the country is implied. Empty string if absent.
- summary: 1-2 factual sentences capturing the candidate's seniority and domain (e.g. "Senior backend engineer with 8 years building payments systems at fintechs."). No marketing language. No first-person.
- yearsOfExperience: total years of professional work, rounded down. Count from the earliest professional role to the latest end date (or today if "present"). Internships count if they were full-time. Education-only candidates: 0.
- skills: 6-15 distinct skills, technologies, methodologies, or tools explicitly mentioned in the resume. Specific over generic ("React 18 + TypeScript" beats "frontend"). No duplicates. Skip soft-skill platitudes ("team player").
- experience: each professional role as a separate entry. Order: most recent first.
  - company: organization name as written.
  - title: role title as written.
  - startDate: "YYYY-MM". If only a year is given, use "YYYY-01".
  - endDate: "YYYY-MM" for completed roles, or the literal string "present" for ongoing roles.
  - description: 1-3 sentences summarizing what they did and notable outcomes. Concise; quote specifics from the resume (numbers, technologies, scope).
- education: each degree/certification as a separate entry. Order: most recent first.
  - institution: school/university name.
  - degree: degree name as written (e.g. "B.Tech Computer Science", "M.Sc. Design").
  - year: graduation year as a number. If only "expected 2026" or "in progress", use that year.
- links: linkedin, portfolio, github URLs if explicitly present in the resume. Each subfield is a string — use "" if that link is not in the resume. Do NOT invent links from names.

Rules:
- If the resume is in a non-English language, translate the structural fields to English (titles, degrees, locations) but keep proper nouns (company names, institution names) as-is.
- If you genuinely cannot read enough of the resume to extract any fields, return all neutral empties.
- Never combine multiple roles or degrees into one entry. Each row is one role or one degree.
- summary should be at most 30 words.`;

export const PARSE_RESUME_USER = (resumeText: string) => `Resume:
"""
${resumeText}
"""

Extract the structured candidate profile.`;

export const PARSE_RESUME_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    phone: { type: "string" },
    location: { type: "string" },
    summary: { type: "string" },
    yearsOfExperience: { type: "number" },
    skills: {
      type: "array",
      items: { type: "string" },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          description: { type: "string" },
        },
        required: ["company", "title", "startDate", "endDate", "description"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          year: { type: "number" },
        },
        required: ["institution", "degree", "year"],
      },
    },
    links: {
      type: "object",
      additionalProperties: false,
      properties: {
        linkedin: { type: "string" },
        portfolio: { type: "string" },
        github: { type: "string" },
      },
      required: ["linkedin", "portfolio", "github"],
    },
  },
  required: [
    "phone",
    "location",
    "summary",
    "yearsOfExperience",
    "skills",
    "experience",
    "education",
    "links",
  ],
} as const;

export type ParseResumeResult = {
  phone: string;
  location: string;
  summary: string;
  yearsOfExperience: number;
  skills: string[];
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    year: number;
  }[];
  links: {
    linkedin: string;
    portfolio: string;
    github: string;
  };
};
