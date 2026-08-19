import { nanoid } from "nanoid";
import { getAppConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import {
  buildMockAnswer,
  buildMockFollowUps,
} from "@/lib/mock/data";
import { getLlmProvider } from "@/lib/providers/llm";
import { createMockSearchProvider } from "@/lib/providers/search/mock";
import { getSearchProvider } from "@/lib/providers/search";
import {
  buildSystemPrompt,
  buildUserPrompt,
} from "@/lib/research/prompts";
import type {
  ResearchMode,
  ResearchStage,
  Source,
  StreamEvent,
} from "@/lib/types";
import { rankSources } from "@/lib/sources";
import { sleep } from "@/lib/utils";

export interface RunResearchInput {
  query: string;
  mode: ResearchMode;
  sessionId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  attachments?: Array<{ name: string; mime?: string; text: string }>;
}

type Emit = (event: StreamEvent) => Promise<void> | void;

async function emitStage(emit: Emit, stage: ResearchStage, sessionId: string) {
  await emit({ type: "stage", stage, sessionId });
}

async function streamText(
  emit: Emit,
  sessionId: string,
  text: string,
  delayMs = 12,
) {
  const chunks = text.split(/(\s+)/);
  for (const chunk of chunks) {
    await emit({ type: "token", token: chunk, sessionId });
    if (delayMs > 0) await sleep(delayMs);
  }
}

export async function runResearchPipeline(
  input: RunResearchInput,
  emit: Emit,
) {
  const sessionId = input.sessionId || nanoid(12);
  const config = getAppConfig();
  const search = getSearchProvider();
  const llm = getLlmProvider();
  const maxResults = input.mode === "deep" ? 10 : 5;

  try {
    await emitStage(emit, "searching", sessionId);

    let sources: Source[] = [];
    const priorUser = input.history
      ?.filter((item) => item.role === "user")
      .at(-1)?.content;
    const fileHint = input.attachments?.[0]?.text.slice(0, 140);
    const extra = [priorUser, fileHint].filter(
      (part): part is string => Boolean(part) && part !== input.query,
    );
    const searchQuery = extra
      .reduce((query, part) => `${query} ${part}`.slice(0, 320), input.query)
      .trim();
    try {
      sources = await search.search(searchQuery, maxResults + 3);
    } catch (error) {
      logger.warn("Search provider failed; falling back to mock", {
        provider: config.searchProvider,
        error: error instanceof Error ? error.message : String(error),
      });
      sources = await createMockSearchProvider().search(
        input.query,
        maxResults + 3,
      );
    }

    sources = rankSources(sources, maxResults);

    if (sources.length === 0) {
      throw new Error("No sources found for this query. Try refining it.");
    }

    await emit({ type: "sources", sources, sessionId });
    await emitStage(emit, "reading", sessionId);
    await sleep(input.mode === "deep" ? 180 : 80);
    await emitStage(emit, "analyzing", sessionId);
    await sleep(input.mode === "deep" ? 200 : 90);
    await emitStage(emit, "synthesizing", sessionId);

    let answer = "";

    if (llm.name === "mock") {
      answer = buildMockAnswer(input.query, sources, input.mode);
      await streamText(emit, sessionId, answer, 4);
    } else {
      try {
        answer = await llm.stream({
          messages: [
            { role: "system", content: buildSystemPrompt(input.mode) },
            {
              role: "user",
              content: buildUserPrompt({
                query: input.query,
                mode: input.mode,
                sources,
                history: input.history,
                attachments: input.attachments,
              }),
            },
          ],
          onToken: async (token) => {
            await emit({ type: "token", token, sessionId });
          },
        });
      } catch (error) {
        logger.warn("LLM provider failed; falling back to mock synthesis", {
          provider: config.llmProvider,
          error: error instanceof Error ? error.message : String(error),
        });
        answer = buildMockAnswer(input.query, sources, input.mode);
        await streamText(emit, sessionId, answer, 3);
      }
    }

    if (!answer.trim()) {
      throw new Error("The model returned an empty answer. Please try again.");
    }

    let followUps: string[] = [];
    try {
      followUps =
        llm.name === "mock"
          ? buildMockFollowUps(input.query)
          : await llm.suggestFollowUps(input.query, answer);
    } catch (error) {
      logger.warn("Follow-up generation failed; using defaults", {
        error: error instanceof Error ? error.message : String(error),
      });
      followUps = buildMockFollowUps(input.query);
    }

    await emit({ type: "follow_ups", followUps, sessionId });
    await emitStage(emit, "complete", sessionId);
    await emit({ type: "done", sessionId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected research failure";
    logger.error("Research failed", { message, sessionId });
    await emit({ type: "error", error: message, sessionId });
    await emit({ type: "stage", stage: "error", sessionId });
  }
}
