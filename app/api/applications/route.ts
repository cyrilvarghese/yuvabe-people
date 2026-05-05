import { NextResponse } from "next/server";
import { z } from "zod";
import { saveApplication, type Application } from "@/lib/applications-store";
import { saveCandidate } from "@/lib/candidates-store";

export const runtime = "nodejs";

const saveSchema = z.object({
  jobId:    z.string().min(1),
  jobCode:  z.string().min(1),
  candidate: z.object({
    name:       z.string().min(1),
    email:      z.string(),
    phone:      z.string(),
    location:   z.string(),
    skills:     z.array(z.string()),
    resumeText: z.string(),
  }),
  matchSummary: z.string(),
  breakdown: z.array(
    z.object({
      criterionLabel: z.string(),
      importance:     z.enum(["must", "strong", "nice"]),
      matched:        z.enum(["yes", "partial", "no"]),
      evidence:       z.string(),
      score:          z.number().min(0).max(10),
    })
  ),
  matchScore:  z.number().min(0).max(100),
  coverLetter: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const candidateId = crypto.randomUUID();
    await saveCandidate({
      id:                candidateId,
      name:              data.candidate.name,
      email:             data.candidate.email,
      phone:             data.candidate.phone,
      location:          data.candidate.location,
      summary:           "",
      yearsOfExperience: 0,
      skills:            data.candidate.skills,
      experience:        [],
      education:         [],
      resumeText:        data.candidate.resumeText,
    });

    const application: Application = {
      id:             crypto.randomUUID(),
      jobId:          data.jobId,
      jobCode:        data.jobCode,
      candidateId,
      matchScore:     data.matchScore,
      matchSummary:   data.matchSummary,
      matchBreakdown: data.breakdown,
      coverLetter:    data.coverLetter ?? "",
      receivedAt:     new Date().toISOString(),
      status:         "new",
    };

    await saveApplication(application);

    return NextResponse.json({ application }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save";
    console.error("[api/applications POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
