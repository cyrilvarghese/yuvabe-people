import { NextResponse } from "next/server";
import { extractCriteria } from "@/lib/llm";
import { extractTextFromFile } from "@/lib/parseUpload";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data with a `file` field." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = await extractTextFromFile(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't read file";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const trimmed = parsed.text.trim();
  if (trimmed.length < 50) {
    return NextResponse.json(
      { error: "Couldn't read enough text from this file (might be an image-only PDF)." },
      { status: 400 }
    );
  }

  try {
    const result = await extractCriteria(trimmed);
    return NextResponse.json({
      ...result,
      jd_text: trimmed,
      file: { name: parsed.filename, size: parsed.size },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[extract-criteria]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
