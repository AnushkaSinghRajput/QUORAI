import { nanoid } from "nanoid";
import type { SearchProvider } from "@/lib/providers/search/types";
import type { Source } from "@/lib/types";
import { extractDomain, faviconUrl } from "@/lib/utils";
import { domainCredibility } from "@/lib/sources";

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string;
}

export function createTavilyProvider(apiKey: string): SearchProvider {
  return {
    name: "tavily",
    async search(query, maxResults) {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: maxResults,
          include_answer: false,
          search_depth: maxResults > 6 ? "advanced" : "basic",
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed (${response.status})`);
      }

      const data = (await response.json()) as { results?: TavilyResult[] };
      const results = data.results ?? [];

      return results.map((item, index): Source => {
        const url = item.url ?? "";
        const domain = extractDomain(url);
        const relevance = Number(
          (item.score ?? Math.max(0.4, 0.92 - index * 0.05)).toFixed(2),
        );
        return {
          id: nanoid(8),
          title: item.title || domain || "Untitled source",
          url,
          domain,
          snippet: item.content || "No snippet available.",
          relevance,
          credibility: domainCredibility(domain),
          publishedAt: item.published_date,
          favicon: faviconUrl(domain),
        };
      });
    },
  };
}
