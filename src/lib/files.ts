export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 180_000;
export const ACCEPTED_ATTACHMENT_TYPES = [
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".json",
  ".html",
  ".htm",
  ".xml",
  ".log",
] as const;

const TEXT_MIME = /^(text\/|application\/(json|xml|csv))/i;

export interface ResearchAttachment {
  name: string;
  mime: string;
  text: string;
}

export function isAcceptedAttachment(file: File) {
  const name = file.name.toLowerCase();
  return (
    ACCEPTED_ATTACHMENT_TYPES.some((ext) => name.endsWith(ext)) ||
    TEXT_MIME.test(file.type)
  );
}

export async function readAttachment(file: File): Promise<ResearchAttachment> {
  if (!isAcceptedAttachment(file)) {
    throw new Error(`${file.name} isn’t a supported text file.`);
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`${file.name} is over 180 KB. Trim it and try again.`);
  }

  const text = (await file.text()).replace(/\u0000/g, "").trim();
  if (text.length < 8) {
    throw new Error(`${file.name} doesn’t contain readable text.`);
  }

  return {
    name: file.name.slice(0, 180),
    mime: file.type || "text/plain",
    text: text.slice(0, 24_000),
  };
}

export function defaultQueryForAttachments(files: ResearchAttachment[]) {
  if (files.length === 1) {
    return `Analyze “${files[0].name}” and verify its claims against current web sources.`;
  }
  return `Analyze the attached files (${files.map((file) => file.name).join(", ")}) and verify the claims against current web sources.`;
}
