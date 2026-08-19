import { getAppConfig } from "@/lib/config";
import { createMockSearchProvider } from "@/lib/providers/search/mock";
import { createSerperProvider } from "@/lib/providers/search/serper";
import { createTavilyProvider } from "@/lib/providers/search/tavily";
import type { SearchProvider } from "@/lib/providers/search/types";

export function getSearchProvider(): SearchProvider {
  const config = getAppConfig();

  switch (config.searchProvider) {
    case "tavily":
      return createTavilyProvider(config.keys.tavily!);
    case "serper":
      return createSerperProvider(config.keys.serper!);
    default:
      return createMockSearchProvider();
  }
}
