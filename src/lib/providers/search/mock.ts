import type { SearchProvider } from "@/lib/providers/search/types";
import { getMockSources } from "@/lib/mock/data";
import { sleep } from "@/lib/utils";

export function createMockSearchProvider(): SearchProvider {
  return {
    name: "mock",
    async search(query, maxResults) {
      await sleep(700 + Math.random() * 500);
      return getMockSources(query, maxResults);
    },
  };
}
