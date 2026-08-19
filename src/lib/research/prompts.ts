import type { Source } from "@/lib/types";
import type { SynthesisContext } from "@/lib/providers/llm/types";

export function buildSystemPrompt(mode: "quick" | "deep"): string {
  if (mode === "deep") {
    return [
      "You are QUORAI, an expert research analyst.",
      "Synthesize the provided web sources into a structured brief.",
      "Use Markdown with short headings and tight bullets.",
      "Cite sources inline with [n] on every factual claim.",
      "If sources disagree, say so. If evidence is thin, say what is unknown.",
      "Do not invent URLs, quotes, dates, or numbers.",
      "If the user uploaded files, treat them as primary evidence and check them against the live web.",
    ].join(" ");
  }

  return [
    "You are QUORAI, a precise research assistant.",
    "Answer from the provided sources only.",
    "Use Markdown. Cite with [n] on each factual sentence.",
    "Prefer a short, scannable answer over padding.",
    "If the sources do not cover the question, say so instead of guessing.",
    "If files were uploaded, treat them as primary evidence and verify against the sources.",
  ].join(" ");
}

export function buildUserPrompt(ctx: SynthesisContext): string {
  const sourceBlock = ctx.sources
    .map(
      (source: Source, index: number) =>
        `[${index + 1}] ${source.title}\nURL: ${source.url}\nCredibility: ${source.credibility} | Relevance: ${source.relevance}\nSnippet: ${source.snippet}`,
    )
    .join("\n\n");

  const historyBlock =
    ctx.history && ctx.history.length > 0
      ? `\nConversation so far:\n${ctx.history
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n")}\n`
      : "";

  const attachmentBlock =
    ctx.attachments && ctx.attachments.length > 0
      ? `\nUploaded files (treat as primary evidence; still cite the live web):\n${ctx.attachments
          .map(
            (file, index) =>
              `File ${index + 1}: ${file.name}\n${file.text}`,
          )
          .join("\n\n")}\n`
      : "";

  return `${historyBlock}${attachmentBlock}User query: ${ctx.query}\n\nSources (already ranked; prefer higher items):\n${sourceBlock}\n\nWrite the ${ctx.mode === "deep" ? "deep research brief" : "answer"} now. Use only these sources.`;
}

export function buildFollowUpPrompt(query: string, answer: string): string {
  return `Based on this research query and answer, suggest exactly 3 short follow-up questions a curious researcher would ask next. Return them as a plain numbered list.\n\nQuery: ${query}\n\nAnswer:\n${answer.slice(0, 2500)}`;
}
