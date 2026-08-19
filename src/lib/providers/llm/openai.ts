import type { LlmProvider } from "@/lib/providers/llm/types";
import { buildFollowUpPrompt } from "@/lib/research/prompts";

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
              choices?: Array<{ delta?: { content?: string } }>;
            };
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

      return full;
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
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content ?? "";
      return text
        .split("\n")
        .map((line) => line.replace(/^\d+[\).]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    },
  };
}
