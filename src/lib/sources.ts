import type { CredibilityLevel, Source } from "@/lib/types";

const HIGH_DOMAINS = new Set([
  "arxiv.org",
  "nature.com",
  "science.org",
  "nih.gov",
  "who.int",
  "cdc.gov",
  "europa.eu",
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "bbc.co.uk",
  "ft.com",
  "wsj.com",
  "nytimes.com",
  "economist.com",
  "wikipedia.org",
  "jstor.org",
  "ssrn.com",
]);

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.hostname.replace(/^www\./, "")}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function domainCredibility(domain: string): CredibilityLevel {
  const host = domain.toLowerCase().replace(/^www\./, "");
  if (
    HIGH_DOMAINS.has(host) ||
    host.endsWith(".gov") ||
    host.endsWith(".edu") ||
    host.endsWith(".ac.uk")
  ) {
    return "high";
  }
  if (host.endsWith(".org") || host.split(".").length <= 2) {
    return "medium";
  }
  return "low";
}

function credibilityWeight(level: CredibilityLevel) {
  if (level === "high") return 1;
  if (level === "medium") return 0.62;
  return 0.32;
}

export function rankSources(sources: Source[], limit: number): Source[] {
  const seen = new Set<string>();
  const unique: Source[] = [];

  for (const source of sources) {
    if (!source.url) continue;
    const key = normalizeUrl(source.url);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      ...source,
      credibility: domainCredibility(source.domain),
    });
  }

  return unique
    .sort((a, b) => {
      const scoreA = a.relevance * 0.62 + credibilityWeight(a.credibility) * 0.38;
      const scoreB = b.relevance * 0.62 + credibilityWeight(b.credibility) * 0.38;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}
