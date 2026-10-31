import { contentTokens, numericTokens } from "@/lib/text-match";
import type { CredibilityLevel, Source } from "@/lib/types";

export const CITATION_PATTERN = /\[\d+(?:\s*,\s*\d+)*\]/g;

export type SupportLevel = "strong" | "moderate" | "weak" | "unresolved";

export interface CitationLink {
  sourceIndex: number;
  probability: number;
  level: SupportLevel;
}

export interface Claim {
  id: string;
  text: string;
  citations: CitationLink[];
  /** Noisy-OR of the individual citation probabilities. */
  probability: number;
  level: SupportLevel;
}

export interface SourceSupport {
  citedCount: number;
  probability: number;
  level: SupportLevel;
}

export interface CitationAnalysis {
  claims: Claim[];
  bySource: Record<number, SourceSupport>;
  totalClaims: number;
  citedClaims: number;
  confidence: number;
  documentCitations: number;
  webCitations: number;
  unresolved: number;
}

const CREDIBILITY_FACTOR: Record<CredibilityLevel, number> = {
  high: 1,
  medium: 0.92,
  low: 0.8,
};

export function supportLevel(probability: number): SupportLevel {
  if (probability >= 0.7) return "strong";
  if (probability >= 0.45) return "moderate";
  return "weak";
}

export function parseCitationNumbers(marker: string): number[] {
  return (marker.match(/\d+/g) ?? []).map(Number);
}

function cleanClaim(text: string) {
  return text
    .replace(CITATION_PATTERN, "")
    .replace(/\*\*|`|^#+\s*|^[-*]\s+|^\d+\.\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Estimated probability that a source supports a claim, from lexical and
 * numeric evidence overlap weighted by source credibility.
 */
function supportProbability(claim: string, source: Source) {
  const claimTokens = Array.from(new Set(contentTokens(claim)));
  if (claimTokens.length === 0) return 0.5;
  const sourceText = `${source.title} ${source.snippet}`;
  const sourceTokens = new Set(contentTokens(sourceText));
  const overlap =
    claimTokens.filter((token) => sourceTokens.has(token)).length /
    claimTokens.length;

  const claimNumbers = numericTokens(claim);
  const sourceNumbers = new Set(numericTokens(sourceText));
  let numeric = 0;
  for (const value of claimNumbers) {
    numeric += sourceNumbers.has(value) ? 0.12 : -0.1;
  }
  numeric = Math.max(-0.3, Math.min(0.3, numeric));

  const raw = 1 / (1 + Math.exp(-(7 * (overlap + numeric) - 2.4)));
  const weighted = raw * CREDIBILITY_FACTOR[source.credibility];
  return Math.max(0.03, Math.min(0.98, weighted));
}

function splitSentences(line: string) {
  return line.split(/(?<=[.!?](?:\s*\[\d+(?:\s*,\s*\d+)*\])*)\s+(?=[A-Z0-9*“"(])/);
}

export function analyzeCitations(answer: string, sources: Source[]): CitationAnalysis {
  const claims: Claim[] = [];
  const perSource = new Map<number, number[]>();
  let totalClaims = 0;
  let unresolved = 0;
  let documentCitations = 0;
  let webCitations = 0;

  answer.split("\n").forEach((line, lineIndex) => {
    if (!line.trim() || /^\s*#/.test(line)) return;
    if (/^\s*\*\*[^*]+:\*\*/.test(line) && !line.match(CITATION_PATTERN)) return;
    if (/^\s*\*[^*].*\*\s*$/.test(line)) return;
    const units = /^\s*(?:[-*]|\d+\.)\s+/.test(line) ? [line] : splitSentences(line);
    units.forEach((sentence, sentenceIndex) => {
      const text = cleanClaim(sentence);
      const markers = sentence.match(CITATION_PATTERN) ?? [];
      if (contentTokens(text).length < 4 && markers.length === 0) return;
      totalClaims += 1;
      if (markers.length === 0) return;

      const numbers = Array.from(new Set(markers.flatMap(parseCitationNumbers)));
      const citations = numbers.map((number): CitationLink => {
        const source = sources[number - 1];
        if (!source) {
          unresolved += 1;
          return { sourceIndex: number - 1, probability: 0, level: "unresolved" };
        }
        if (source.kind === "document") documentCitations += 1;
        else webCitations += 1;
        const probability = supportProbability(text, source);
        perSource.set(number - 1, [...(perSource.get(number - 1) ?? []), probability]);
        return { sourceIndex: number - 1, probability, level: supportLevel(probability) };
      });

      const resolved = citations.filter((item) => item.level !== "unresolved");
      const probability = resolved.length
        ? 1 - resolved.reduce((product, item) => product * (1 - item.probability), 1)
        : 0;
      claims.push({
        id: `${lineIndex}-${sentenceIndex}`,
        text,
        citations,
        probability,
        level: resolved.length ? supportLevel(probability) : "unresolved",
      });
    });
  });

  const bySource: Record<number, SourceSupport> = {};
  for (const [index, values] of perSource) {
    const probability = values.reduce((sum, value) => sum + value, 0) / values.length;
    bySource[index] = {
      citedCount: values.length,
      probability,
      level: supportLevel(probability),
    };
  }

  const citedClaims = claims.length;
  const coverage = totalClaims ? citedClaims / totalClaims : 0;
  const meanSupport = citedClaims
    ? claims.reduce((sum, claim) => sum + claim.probability, 0) / citedClaims
    : 0;

  return {
    claims,
    bySource,
    totalClaims,
    citedClaims,
    confidence: meanSupport * (0.6 + 0.4 * coverage),
    documentCitations,
    webCitations,
    unresolved,
  };
}
