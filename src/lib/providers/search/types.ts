import type { Source } from "@/lib/types";

export interface SearchProvider {
  name: string;
  search(query: string, maxResults: number): Promise<Source[]>;
}
