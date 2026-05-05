import { NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/parseUpload";
import { getJobByCode } from "@/lib/jobs-store";
import { matchResume } from "@/lib/llm";
import { computeMatchScore } from "@/lib/score";
import type { CriterionMatch } from "@/lib/applications-store";

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

  const jobCode = formData.get("jobCode");
  if (!jobCode || typeof jobCode !== "string") {
    return NextResponse.json({ error: "jobCode is required." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No resume file uploaded." }, { status: 400 });
  }

  const job = await getJobByCode(jobCode);
  if (!job) {
    return NextResponse.json({ error: `Job ${jobCode} not found.` }, { status: 404 });
  }

  let parsed;
  try {
    parsed = await extractTextFromFile(file);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't read file" },
      { status: 400 }
    );
  }

  const resumeText = parsed.text.trim();
  if (resumeText.length < 50) {
    return NextResponse.json(
      { error: "Couldn't read enough text from this resume (might be an image-only PDF)." },
      { status: 400 }
    );
  }

  try {
    const result = await matchResume(job.criteria, resumeText);

    // Merge importance from job criteria into breakdown by matching label.
    const criteriaMap = new Map(job.criteria.map((c) => [c.label, c]));
    const breakdown: CriterionMatch[] = result.breakdown.map((item) => ({
      criterionLabel: item.criterionLabel,
      importance: criteriaMap.get(item.criterionLabel)?.importance ?? "strong",
      matched: item.matched,
      evidence: item.evidence,
      score: item.score,
    }));

    const matchScore = computeMatchScore(breakdown);

    return NextResponse.json({
      candidate: {
        name: result.candidateName,
        email: result.candidateEmail,
        phone: result.candidatePhone,
        location: result.candidateLocation,
        skills: result.candidateSkills,
        resumeText,
      },
      matchSummary: result.matchSummary,
      breakdown,
      matchScore,
      jobId: job.id,
      jobCode: job.code,
      jobTitle: job.title,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[match-resume]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
