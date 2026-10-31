import type { Source } from "@/lib/types";
import type { SynthesisContext } from "@/lib/providers/llm/types";

export function buildSystemPrompt(mode: "quick" | "deep"): string {
  if (mode === "deep") {
    return [
      "You are QUORAI, an expert research analyst and data scientist.",
      "Synthesize the provided evidence into a structured, executive-grade brief.",
      "Use Markdown with clear headings, comparison tables, and tight bullets.",
      "Cite sources inline with [n] on every factual claim and data point.",
      "If the user uploaded files or CSV datasets, treat them as primary empirical evidence: analyze distributions, calculate aggregates, and extract specific figures.",
      "Cross-verify the dataset findings against the ranked external web sources.",
      "If sources disagree or data shows anomalies, explicitly state what is unknown or divergent.",
      "Do not invent URLs, figures, or claims not supported by the evidence.",
    ].join(" ");
  }

  return [
    "You are QUORAI, a precise research assistant and data analyst.",
    "Answer from the provided sources and uploaded files.",
    "Use Markdown with inline citations [n] on each factual sentence.",
    "If files or CSV datasets were uploaded, treat them as primary empirical evidence and extract key metrics.",
    "Prefer a structured, scannable answer over padding.",
    "Do not invent citations or ungrounded claims.",
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
      ? `\nUploaded files (PRIMARY EVIDENCE - analyze thoroughly; cite [1] etc.):\n${ctx.attachments
          .map(
            (file, index) =>
              `File ${index + 1}: ${file.name}\n${file.text}`,
          )
          .join("\n\n")}\n`
      : "";

  const instruction =
    ctx.attachments && ctx.attachments.length > 0
      ? `Write the ${ctx.mode === "deep" ? "deep research brief" : "answer"} now. Ground your findings primarily in the uploaded file data, extract key statistics and distributions, and cross-reference with the external sources citing [n].`
      : `Write the ${ctx.mode === "deep" ? "deep research brief" : "answer"} now using the provided sources with inline citations [n].`;

  return `${historyBlock}${attachmentBlock}User query: ${ctx.query}\n\nSources (already ranked; prefer higher items):\n${sourceBlock}\n\n${instruction}`;
}

export function buildFollowUpPrompt(query: string, answer: string): string {
  return `Based on this research query and answer, suggest exactly 3 short follow-up questions a curious researcher would ask next. Return them as a plain numbered list.\n\nQuery: ${query}\n\nAnswer:\n${answer.slice(0, 2500)}`;
}
