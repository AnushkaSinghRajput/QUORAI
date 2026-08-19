"use client";

import type { ResearchMode, StreamEvent } from "@/lib/types";
import type { ResearchAttachment } from "@/lib/files";
import { useHistoryStore } from "@/lib/store/history-store";
import {
  pauseSessionPersist,
  resumeSessionPersist,
  useResearchStore,
} from "@/lib/store/research-store";

const controllers = new Map<string, AbortController>();

async function consumeResearchStream(
  sessionId: string,
  body: {
    query: string;
    mode: ResearchMode;
    sessionId: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    attachments?: ResearchAttachment[];
  },
) {
  const applyEvent = useResearchStore.getState().applyEvent;
  const setStreaming = useResearchStore.getState().setStreaming;

  controllers.get(sessionId)?.abort();
  const controller = new AbortController();
  controllers.set(sessionId, controller);

  setStreaming(true);
  pauseSessionPersist();

  try {
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.status === 429) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      applyEvent(sessionId, {
        type: "error",
        error:
          data?.error ??
          "Rate limit reached. Please wait a moment before researching again.",
      });
      return;
    }

    if (!response.ok || !response.body) {
      applyEvent(sessionId, {
        type: "error",
        error: `Request failed (${response.status})`,
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part
          .split("\n")
          .find((entry) => entry.startsWith("data:"));
        if (!line) continue;
        const raw = line.slice(5).trim();
        if (!raw) continue;
        try {
          const event = JSON.parse(raw) as StreamEvent;
          applyEvent(sessionId, event);
        } catch {
          // ignore malformed SSE chunks
        }
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }
    applyEvent(sessionId, {
      type: "error",
      error:
        error instanceof Error
          ? error.message
          : "Network error while researching",
    });
  } finally {
    if (controllers.get(sessionId) === controller) {
      controllers.delete(sessionId);
    }
    resumeSessionPersist();
    setStreaming(false);
  }
}

/** Creates a session and starts streaming without blocking navigation. */
export function beginResearch(
  query: string,
  mode: ResearchMode,
  attachments?: ResearchAttachment[],
) {
  const displayQuery = attachments?.length
    ? `${query}\nAttached: ${attachments.map((file) => file.name).join(", ")}`
    : query;
  const session = useResearchStore.getState().startSession(displayQuery, mode);
  useHistoryStore.getState().add({
    id: session.id,
    query: displayQuery,
    mode,
  });
  void consumeResearchStream(session.id, {
    query,
    mode,
    sessionId: session.id,
    attachments,
  });
  return session.id;
}

export function continueResearch(sessionId: string, query: string) {
  const session = useResearchStore.getState().getSession(sessionId);
  if (!session) return;

  useResearchStore.getState().appendFollowUp(sessionId, query);
  useHistoryStore.getState().add({
    id: sessionId,
    query,
    mode: session.mode,
  });

  const history = session.messages.slice(-8).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  void consumeResearchStream(sessionId, {
    query,
    mode: session.mode,
    sessionId,
    history,
  });
}
