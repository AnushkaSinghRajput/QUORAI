import type { LlmProvider } from "@/lib/providers/llm/types";
import { buildFollowUpPrompt } from "@/lib/research/prompts";

export function createAnthropicProvider(
  apiKey: string,
  model: string,
): LlmProvider {
  return {
    name: "anthropic",
    async stream({ messages, onToken }) {
      const system = messages.find((m) => m.role === "system")?.content;
      const chatMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          stream: true,
          system,
          messages: chatMessages,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Anthropic request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          try {
            const json = JSON.parse(data) as {
              type?: string;
              delta?: { type?: string; text?: string };
            };
            if (
              json.type === "content_block_delta" &&
              json.delta?.type === "text_delta" &&
              json.delta.text
            ) {
              full += json.delta.text;
              await onToken(json.delta.text);
            }
          } catch {
            // ignore
          }
        }
      }

      return full;
    },
    async suggestFollowUps(query, answer) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 256,
          messages: [
            {
              role: "user",
              content: buildFollowUpPrompt(query, answer),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic follow-up failed (${response.status})`);
      }

      const data = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const text =
        data.content?.find((block) => block.type === "text")?.text ?? "";
      return text
        .split("\n")
        .map((line) => line.replace(/^\d+[\).]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    },
  };
}
