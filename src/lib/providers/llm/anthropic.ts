import type { LlmProvider, LlmUsage } from "@/lib/providers/llm/types";
import { buildFollowUpPrompt } from "@/lib/research/prompts";

function tokens(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}

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
      const usage: LlmUsage = { model };
      let stopReason: string | undefined;

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
              message?: {
                model?: string;
                usage?: { input_tokens?: number; output_tokens?: number };
              };
              delta?: { type?: string; text?: string; stop_reason?: string | null };
              usage?: { output_tokens?: number };
            };
            if (json.type === "message_start") {
              usage.model = json.message?.model ?? usage.model;
              usage.inputTokens = tokens(json.message?.usage?.input_tokens) ?? usage.inputTokens;
              usage.outputTokens =
                tokens(json.message?.usage?.output_tokens) ?? usage.outputTokens;
            }
            if (json.type === "message_delta") {
              if (json.delta?.stop_reason) stopReason = json.delta.stop_reason;
              usage.outputTokens = tokens(json.usage?.output_tokens) ?? usage.outputTokens;
            }
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

      return { text: full, ...usage, stopReason: stopReason ?? "end_turn" };
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
        model?: string;
        stop_reason?: string | null;
        usage?: { input_tokens?: number; output_tokens?: number };
        content?: Array<{ type?: string; text?: string }>;
      };
      const text =
        data.content?.find((block) => block.type === "text")?.text ?? "";
      return {
        followUps: text
          .split("\n")
          .map((line) => line.replace(/^\d+[\).]\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 3),
        model: data.model ?? model,
        stopReason: data.stop_reason ?? "end_turn",
        inputTokens: tokens(data.usage?.input_tokens),
        outputTokens: tokens(data.usage?.output_tokens),
      };
    },
  };
}
