import { nanoid } from "nanoid";
import type { SearchProvider } from "@/lib/providers/search/types";
import type { Source } from "@/lib/types";
import { extractDomain, faviconUrl } from "@/lib/utils";
import { domainCredibility } from "@/lib/sources";

interface SerperOrganic {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
}

export function createSerperProvider(apiKey: string): SearchProvider {
  return {
    name: "serper",
    async search(query, maxResults) {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({ q: query, num: maxResults }),
      });

      if (!response.ok) {
        throw new Error(`Serper search failed (${response.status})`);
      }

      const data = (await response.json()) as { organic?: SerperOrganic[] };
      const results = data.organic ?? [];

      return results.slice(0, maxResults).map((item, index): Source => {
        const url = item.link ?? "";
        const domain = extractDomain(url);
        const relevance = Number(Math.max(0.35, 0.9 - index * 0.05).toFixed(2));
        return {
          id: nanoid(8),
          title: item.title || domain || "Untitled source",
          url,
          domain,
          snippet: item.snippet || "No snippet available.",
          relevance,
          credibility: domainCredibility(domain),
          publishedAt: item.date,
          favicon: faviconUrl(domain),
        };
      });
    },
  };
}
