import type { ResearchMode, Source } from "@/lib/types";

/** True when an LLM failure is billing/quota rather than a hard outage. */
export function isLlmBillingFailure(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("no credits") ||
    lower.includes("credit balance") ||
    lower.includes("billing") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("(429)") ||
    lower.includes("insufficient_quota") ||
    lower.includes("payment")
  );
}

/**
 * Honest brief assembled from live search/document snippets when model APIs
 * are unavailable (e.g. billing). Never invents facts beyond source text.
 */
export function buildExtractiveBrief(
  query: string,
  sources: Source[],
  mode: ResearchMode,
  modelFailures: string[],
): string {
  const web = sources.filter((s) => s.kind !== "document");
  const docs = sources.filter((s) => s.kind === "document");
  const take = mode === "deep" ? 8 : 5;
  const findings = sources.slice(0, take).map((source, i) => {
    const cite = `[${i + 1}]`;
    if (source.kind === "document") {
      const where = [
        source.documentName ?? "Attached document",
        source.page ? `p. ${source.page}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `- **${where}:** ${trimSnippet(source.snippet)} ${cite}`;
    }
    return `- **${source.title}** (${source.domain}): ${trimSnippet(source.snippet)} ${cite}`;
  });

  const reason = modelFailures[0]
    ? modelFailures
        .map((line) => `- ${stripUrls(line)}`)
        .join("\n")
    : "- Model providers returned billing or quota errors.";

  return [
    "> **Extractive brief** — live search succeeded, but model synthesis is paused (provider billing/quota). Findings below are quoted/paraphrased only from retrieved sources — not an LLM-written narrative.",
    "",
    `## Evidence brief`,
    "",
    `**Query:** ${query.split("\nAttached:")[0].trim()}`,
    "",
    `Retrieved **${sources.length}** sources (${web.length} web${docs.length ? `, ${docs.length} document` : ""}).`,
    "",
    "### Key findings",
    findings.join("\n") || "- No snippets were available to extract.",
    "",
    "### Provider note",
    reason,
    "",
    "Add OpenAI or Anthropic credits, then retry for a full model-synthesized brief with tighter claim verification.",
    "",
    "### Citations",
    "Use the Sources panel. Indexes match the `[n]` markers above.",
  ].join("\n");
}

function trimSnippet(text: string, max = 420): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

/** Keep Failproof citation checks from treating billing help links as sources. */
function stripUrls(text: string): string {
  return text.replace(/https?:\/\/\S+/gi, "[billing portal]").trim();
}
