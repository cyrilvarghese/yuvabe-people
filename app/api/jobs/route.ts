import { NextResponse } from "next/server";
import { z } from "zod";
import { createJob, listJobs } from "@/lib/jobs-store";
import { IMPORTANCE_VALUES } from "@/lib/prompts/extractCriteria.v1";

export const runtime = "nodejs";

const createJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(20, "JD seems too short"),
  criteria: z
    .array(
      z.object({
        category: z.enum(["skill", "experience", "education", "domain", "other"]),
        label: z.string().min(1).max(140),
        importance: z.enum(IMPORTANCE_VALUES as readonly [string, ...string[]]),
      })
    )
    .min(1, "At least one criterion is required")
    .max(40),
});

export async function GET() {
  const jobs = await listJobs();
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  try {
    const job = await createJob(parsed.data);
    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create job";
    console.error("[api/jobs POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
