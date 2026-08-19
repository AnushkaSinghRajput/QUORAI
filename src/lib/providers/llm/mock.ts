import {
  buildMockAnswer,
  buildMockFollowUps,
} from "@/lib/mock/data";
import type { LlmProvider } from "@/lib/providers/llm/types";
import { sleep } from "@/lib/utils";

/**
 * Mock LLM used when no API keys are configured.
 * The research pipeline usually short-circuits mock synthesis with real sources;
 * these methods remain for interface completeness and direct provider tests.
 */
export function createMockLlmProvider(): LlmProvider {
  return {
    name: "mock",
    async stream({ messages, onToken }) {
      const user =
        [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
      const query =
        user.match(/User query:\s*(.+)/)?.[1]?.trim() || "your topic";
      const mode = user.includes("deep research") ? "deep" : "quick";
      const answer = buildMockAnswer(
        query,
        [
          {
            id: "1",
            title: "Primary reference",
            url: "https://example.com",
            domain: "example.com",
            snippet: "Demo snippet used for offline synthesis.",
            relevance: 0.9,
            credibility: "high",
          },
        ],
        mode,
      );

      for (const chunk of answer.split(/(\s+)/)) {
        await onToken(chunk);
        await sleep(10);
      }
      return answer;
    },
    async suggestFollowUps(query) {
      await sleep(200);
      return buildMockFollowUps(query);
    },
  };
}
