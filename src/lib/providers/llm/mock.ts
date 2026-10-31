import {
  buildMockAnswer,
  buildMockFollowUps,
  getMockSources,
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
        user.match(/User query:\s*([^\n]+)/)?.[1]?.trim() || "your topic";
      const mode = user.includes("deep research") ? "deep" : "quick";

      const attachments: Array<{ name: string; text: string }> = [];
      const fileMatch = user.match(
        /File \d+:\s*([^\n]+)\n([\s\S]*?)(?=(?:File \d+:|User query:|$))/g,
      );
      if (fileMatch) {
        for (const block of fileMatch) {
          const m = block.match(/File \d+:\s*([^\n]+)\n([\s\S]*)/);
          if (m) {
            attachments.push({ name: m[1].trim(), text: m[2].trim() });
          }
        }
      }

      const sources = getMockSources(query, mode === "deep" ? 8 : 4);
      const answer = buildMockAnswer(query, sources, mode, attachments);

      for (const chunk of answer.split(/(\s+)/)) {
        await onToken(chunk);
        await sleep(6);
      }
      return { text: answer, model: "mock", stopReason: "stop" };
    },
    async suggestFollowUps(query) {
      await sleep(150);
      return { followUps: buildMockFollowUps(query), model: "mock", stopReason: "stop" };
    },
  };
}
