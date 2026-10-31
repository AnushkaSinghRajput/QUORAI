import { extractText, getDocumentProxy } from "unpdf";
import { errorResponse, jsonResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_TEXT_CHARS = 120_000;

function cleanPage(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/(\w)-\n(\w)/g, "$1$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  const limit = checkRateLimit(`extract:${getClientKey(request)}`, 20, 60_000);
  if (!limit.allowed) {
    return errorResponse("Too many uploads. Please wait a moment.", 429);
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return errorResponse("Send the PDF as multipart form data.", 400);
  }
  if (!(file instanceof File)) {
    return errorResponse("No file was uploaded.", 400);
  }
  if (file.size > MAX_PDF_BYTES) {
    return errorResponse(`${file.name} is over 15 MB.`, 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
    return errorResponse(`${file.name} isn’t a valid PDF.`, 415);
  }

  try {
    const pdf = await getDocumentProxy(bytes);
    const { totalPages, text } = await extractText(pdf, { mergePages: false });

    let output = "";
    let pagesWithText = 0;
    let truncated = false;
    for (const [index, raw] of text.entries()) {
      const page = cleanPage(raw);
      if (!page) continue;
      const block = `[[page:${index + 1}]]\n${page}\n`;
      if (output.length + block.length > MAX_TEXT_CHARS) {
        truncated = true;
        break;
      }
      output += block;
      pagesWithText += 1;
    }

    if (output.replace(/\[\[page:\d+\]\]/g, "").trim().length < 20) {
      return errorResponse(
        `${file.name} has no selectable text — it looks like a scanned image. Export it with OCR and try again.`,
        422,
      );
    }

    return jsonResponse({
      ok: true,
      file: {
        name: file.name.slice(0, 180),
        mime: "application/pdf",
        text: output.trim(),
        pageCount: totalPages,
        pagesWithText,
        truncated,
      },
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") {
      return errorResponse(`${file.name} is password-protected.`, 422);
    }
    logger.warn("PDF extraction failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(`Couldn’t read ${file.name}. The PDF may be damaged.`, 422);
  }
}
