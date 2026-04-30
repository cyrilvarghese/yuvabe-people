import { NextResponse } from "next/server";
import { getJobByCode } from "@/lib/jobs-store";
import { scoreMatch } from "@/lib/llm";
import { extractTextFromFile } from "@/lib/parseUpload";
import { createApplication, type CriterionMatch } from "@/lib/applications-store";
import { upsertCandidateByEmail } from "@/lib/candidates-store";
import { IMPORTANCE_WEIGHT } from "@/lib/prompts/extractCriteria.v1";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data." },
      { status: 400 }
    );
  }

  const jobCode = (formData.get("jobCode") as string | null)?.trim();
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const coverLetter = ((formData.get("coverLetter") as string | null) ?? "").trim();
  const resumeFile = formData.get("resumeFile");
  const resumeTextRaw = ((formData.get("resumeText") as string | null) ?? "").trim();

  if (!jobCode || !name || !email) {
    return NextResponse.json(
      { error: "jobCode, name, and email are required." },
      { status: 400 }
    );
  }

  // Resolve resume text from file upload or raw text
  let resumeText = "";
  if (resumeFile instanceof File && resumeFile.size > 0) {
    try {
      const parsed = await extractTextFromFile(resumeFile);
      resumeText = parsed.text.trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't read resume file";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else if (resumeTextRaw.length > 0) {
    resumeText = resumeTextRaw;
  }

  if (resumeText.length < 50) {
    return NextResponse.json(
      { error: "Resume is too short. Please provide a complete resume." },
      { status: 400 }
    );
  }

  const job = await getJobByCode(jobCode);
  if (!job) {
    return NextResponse.json(
      { error: `No job found with code ${jobCode}.` },
      { status: 404 }
    );
  }

  // Score via LLM
  let llmResult;
  try {
    llmResult = await scoreMatch(job.criteria, resumeText, coverLetter);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    console.error("[score-match]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Build CriterionMatch array — join LLM breakdown with criteria to get importance
  const criteriaMap = new Map(job.criteria.map((c) => [c.label, c]));
  const matchBreakdown: CriterionMatch[] = llmResult.breakdown.map((b) => {
    const criterion = criteriaMap.get(b.criterion_label);
    return {
      criterionLabel: b.criterion_label,
      importance: criterion?.importance ?? "strong",
      matched: b.matched,
      evidence: b.evidence,
      score: Math.round(Math.min(10, Math.max(0, b.score))),
    };
  });

  // Compute weighted match score deterministically (not from LLM)
  let wSum = 0;
  let wMax = 0;
  for (const item of matchBreakdown) {
    const w = IMPORTANCE_WEIGHT[item.importance];
    wSum += item.score * w;
    wMax += 10 * w;
  }
  const matchScore = wMax > 0 ? Math.round((wSum / wMax) * 100) : 0;

  // Upsert candidate (find by email or create)
  const candidate = await upsertCandidateByEmail({
    name,
    email,
    location: llmResult.candidate_location || undefined,
    summary: llmResult.candidate_summary || undefined,
    yearsOfExperience: llmResult.candidate_years_experience || undefined,
    skills: llmResult.candidate_skills.length > 0 ? llmResult.candidate_skills : undefined,
    resumeText,
  });

  const application = await createApplication({
    jobId: job.id,
    jobCode: job.code,
    candidateId: candidate.id,
    matchScore,
    matchSummary: llmResult.match_summary,
    matchBreakdown,
    coverLetter,
  });

  return NextResponse.json({
    applicationId: application.id,
    matchScore,
  });
}
