import OpenAI from "openai";
import {
  EXTRACT_CRITERIA_SYSTEM,
  EXTRACT_CRITERIA_USER,
  EXTRACT_CRITERIA_SCHEMA,
  type ExtractCriteriaResult,
} from "./prompts/extractCriteria.v1";

const MODEL = "gpt-4o";

let client: OpenAI | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to .env.local in the project root."
      );
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function extractCriteria(jd: string): Promise<ExtractCriteriaResult> {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    // OpenAI: "Setting temperature to 0 does not guarantee determinism."
    // Adding a seed makes outputs reproducible for the same input. Note this
    // is best-effort — OpenAI may still drift if the underlying model
    // version changes (`system_fingerprint` in the response indicates that).
    seed: 42,
    messages: [
      { role: "system", content: EXTRACT_CRITERIA_SYSTEM },
      { role: "user", content: EXTRACT_CRITERIA_USER(jd) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "extract_criteria_result",
        schema: EXTRACT_CRITERIA_SCHEMA,
        strict: true,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  return JSON.parse(content) as ExtractCriteriaResult;
}
