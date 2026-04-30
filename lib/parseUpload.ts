import mammoth from "mammoth";
import { extractText } from "unpdf";

export type ParsedFile = {
  text: string;
  filename: string;
  size: number;
};

export async function extractTextFromFile(file: File): Promise<ParsedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return {
      text: new TextDecoder("utf-8").decode(buffer),
      filename: file.name,
      size: file.size,
    };
  }

  if (name.endsWith(".pdf")) {
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    return { text, filename: file.name, size: file.size };
  }

  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, filename: file.name, size: file.size };
  }

  if (name.endsWith(".doc")) {
    throw new Error(
      "Old .doc format isn't supported. Please save as .docx or .pdf and try again."
    );
  }

  throw new Error(
    `Unsupported file type: ${file.name}. Use .pdf, .docx, .txt, or .md.`
  );
}
