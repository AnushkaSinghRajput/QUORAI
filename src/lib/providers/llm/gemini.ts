import type { LlmProvider } from "@/lib/providers/llm/types";
import { buildFollowUpPrompt } from "@/lib/research/prompts";

export function createGeminiProvider(
  apiKey: string,
  model = "gemini-2.5-flash",
): LlmProvider {
  return {
    name: "gemini",
    async stream({ messages, onToken }) {
      const systemMessage = messages.find((m) => m.role === "system")?.content;
      const chatMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const body: Record<string, unknown> = {
        contents: chatMessages,
        generationConfig: {
          temperature: 0.3,
        },
      };

      if (systemMessage) {
        body.system_instruction = {
          parts: [{ text: systemMessage }],
        };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Gemini API request failed (${response.status})`);
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
          if (!data) continue;
          try {
            const json = JSON.parse(data) as {
              candidates?: Array<{
                content?: {
                  parts?: Array<{ text?: string }>;
                };
              }>;
            };
            const textChunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              full += textChunk;
              await onToken(textChunk);
            }
          } catch {
            // ignore
          }
        }
      }

      return { text: full, model, stopReason: "stop" };
    },
    async suggestFollowUps(query, answer) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildFollowUpPrompt(query, answer) }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 256,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini follow-up request failed (${response.status})`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const followUps = text
        .split("\n")
        .map((line) => line.replace(/^\d+[\).]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
      return { followUps, model, stopReason: "stop" };
    },
  };
}
