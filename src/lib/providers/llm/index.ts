import { getAppConfig } from "@/lib/config";
import { createAnthropicProvider } from "@/lib/providers/llm/anthropic";
import { createMockLlmProvider } from "@/lib/providers/llm/mock";
import { createOpenAIProvider } from "@/lib/providers/llm/openai";
import type { LlmProvider } from "@/lib/providers/llm/types";

export function getLlmProvider(): LlmProvider {
  const config = getAppConfig();

  switch (config.llmProvider) {
    case "openai":
      return createOpenAIProvider(config.keys.openai!, config.models.openai);
    case "anthropic":
      return createAnthropicProvider(
        config.keys.anthropic!,
        config.models.anthropic,
      );
    default:
      return createMockLlmProvider();
  }
}
