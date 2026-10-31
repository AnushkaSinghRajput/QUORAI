import type { LlmProvider, LlmUsage } from "@/lib/providers/llm/types";
import { buildFollowUpPrompt } from "@/lib/research/prompts";

function tokens(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}

function usageFrom(payload: {
  model?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
}): LlmUsage {
  return {
    model: payload.model,
    inputTokens: tokens(payload.usage?.prompt_tokens),
    outputTokens: tokens(payload.usage?.completion_tokens),
  };
}

export function createOpenAIProvider(
  apiKey: string,
  model: string,
): LlmProvider {
  return {
    name: "openai",
    async stream({ messages, onToken }) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          stream_options: { include_usage: true },
          temperature: 0.3,
          messages,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`OpenAI request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let usage: LlmUsage = { model };
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
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data) as {
              model?: string;
              choices?: Array<{
                finish_reason?: string | null;
                delta?: { content?: string };
              }>;
              usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
            };
            const next = usageFrom(json);
            usage = {
              model: next.model ?? usage.model,
              inputTokens: next.inputTokens ?? usage.inputTokens,
              outputTokens: next.outputTokens ?? usage.outputTokens,
            };
            const finish = json.choices?.[0]?.finish_reason;
            if (finish) stopReason = finish;
            const token = json.choices?.[0]?.delta?.content;
            if (token) {
              full += token;
              await onToken(token);
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }

      return { text: full, ...usage, stopReason: stopReason ?? "stop" };
    },
    async suggestFollowUps(query, answer) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          messages: [
            {
              role: "user",
              content: buildFollowUpPrompt(query, answer),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI follow-up failed (${response.status})`);
      }

      const data = (await response.json()) as {
        model?: string;
        usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
        choices?: Array<{
          finish_reason?: string | null;
          message?: { content?: string };
        }>;
      };
      const text = data.choices?.[0]?.message?.content ?? "";
      return {
        followUps: text
          .split("\n")
          .map((line) => line.replace(/^\d+[\).]\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 3),
        ...usageFrom(data),
        stopReason: data.choices?.[0]?.finish_reason ?? "stop",
      };
    },
  };
}
