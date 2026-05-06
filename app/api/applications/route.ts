import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listJobs } from "@/lib/jobs-store";
import { createCandidate } from "@/lib/candidates-store";
import { createApplication } from "@/lib/applications-store";
import { sendApplicationEmail } from "@/lib/resend";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  about: z.string().min(10, "Please write at least a few words about yourself"),
  resumeUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  skills: z.array(z.string()),
  jobCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { name, email, about, resumeUrl, skills, jobCode } = parsed.data;

  const jobs = await listJobs();
  const job = jobs.find((j) => j.code === jobCode);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const candidate = await createCandidate({ name, email, summary: about, skills });

  const application = await createApplication({
    jobId: job.id,
    jobCode: job.code,
    candidateId: candidate.id,
    coverLetter: about,
    resumeUrl,
  });

  // Fire-and-forget email — don't block response on mail delivery
  sendApplicationEmail({
    candidateName: name,
    email,
    about,
    resumeUrl,
    skills,
    jobTitle: job.title,
    jobCode: job.code,
  }).catch((err) => console.error("[resend]", err));

  return NextResponse.json({ ok: true, applicationId: application.id });
}
