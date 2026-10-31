import { nanoid } from "nanoid";
import { getAppConfig } from "@/lib/config";
import { buildDocumentEvidence, documentHint } from "@/lib/documents";
import { PolicyDenied, redactSecrets } from "@/lib/failproof/guards";
import { withResearchSession, type ModelCallResult, type ResearchTrace } from "@/lib/failproof/trace";
import { logger } from "@/lib/logger";
import { buildMockAnswer, buildMockFollowUps } from "@/lib/mock/data";
import { getLlmProvider } from "@/lib/providers/llm";
import type { LlmMessage } from "@/lib/providers/llm/types";
import { createMockSearchProvider } from "@/lib/providers/search/mock";
import { getSearchProvider } from "@/lib/providers/search";
import { buildFollowUpPrompt, buildSystemPrompt, buildUserPrompt } from "@/lib/research/prompts";
import type { ResearchMode, ResearchStage, Source, StreamEvent } from "@/lib/types";
import { rankSources } from "@/lib/sources";
import { sleep } from "@/lib/utils";

export interface RunResearchInput {
  query: string;
  mode: ResearchMode;
  sessionId?: string;
  protection?: "protected" | "unprotected";
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  attachments?: Array<{ name: string; mime?: string; text: string }>;
}

type Emit = (event: StreamEvent) => Promise<void> | void;

async function emitStage(emit: Emit, stage: ResearchStage, sessionId: string) {
  await emit({ type: "stage", stage, sessionId });
}

async function streamText(emit: Emit, sessionId: string, text: string, delayMs = 12) {
  const chunks = text.split(/(\s+)/);
  for (const chunk of chunks) {
    await emit({ type: "token", token: chunk, sessionId });
    if (delayMs > 0) await sleep(delayMs);
  }
}

function sourceOutput(sources: Source[]) {
  return {
    resultCount: sources.length,
    domains: sources.map((source) => source.domain),
    titles: sources.map((source) => source.title),
  };
}

async function searchSources(
  trace: ResearchTrace,
  query: string,
  providerName: string,
  maxResults: number,
  run: (query: string) => Promise<Source[]>,
) {
  const safeQuery = trace.prepareTool("web_search", query, providerName);
  return trace.tool(
    "web_search",
    { provider: providerName, query: safeQuery, maxResults },
    sourceOutput,
    () => run(safeQuery),
  );
}

async function completeModel(
  trace: ResearchTrace,
  purpose: "synthesis" | "followups",
  model: string,
  messages: LlmMessage[],
  run: (messages: LlmMessage[]) => Promise<ModelCallResult>,
) {
  const prompt = messages.map((message) => message.content).join("\n");
  const safe = trace.prepareTool(
    purpose === "followups" ? "llm_followups" : "llm_complete",
    prompt,
    model,
  );
  const outbound = safe.includes("[redacted]")
    ? messages.map((message) => ({
        ...message,
        content: redactSecrets(message.content).text,
      }))
    : messages;
  return trace.model(purpose, model, outbound, () => run(outbound));
}

export async function runResearchPipeline(input: RunResearchInput, emit: Emit) {
  const sessionId = input.sessionId || nanoid(12);
  const config = getAppConfig();
  const search = getSearchProvider();
  const llm = getLlmProvider();
  const maxResults = input.mode === "deep" ? 10 : 5;
  let reported = false;

  const reportError = async (message: string) => {
    if (reported) return;
    reported = true;
    logger.error("Research failed", { message, sessionId });
    await emit({ type: "error", error: message, sessionId });
    await emit({ type: "stage", stage: "error", sessionId });
  };

  try {
    await withResearchSession(
      {
        sessionId,
        query: input.query,
        mode: input.mode,
        protection: input.protection ?? "protected",
        history: input.history,
      },
      async (trace) => {
        try {
          await emitStage(emit, "searching", sessionId);

          let sources: Source[] = [];
          const priorUser = input.history
            ?.filter((item) => item.role === "user")
            .at(-1)?.content;
          const fileHint = documentHint(input.attachments?.[0]?.text);
          const extra = [priorUser, fileHint].filter(
            (part): part is string => Boolean(part) && part !== input.query,
          );
          const searchQuery = extra
            .reduce((query, part) => `${query} ${part}`.slice(0, 320), input.query)
            .trim();

          await trace.stage("searching", async () => {
            try {
              sources = await searchSources(
                trace,
                searchQuery,
                search.name,
                maxResults + 3,
                (query) => search.search(query, maxResults + 3),
              );
            } catch (error) {
              if (error instanceof PolicyDenied) throw error;
              const message = error instanceof Error ? error.message : String(error);
              logger.warn("Search provider failed; falling back to mock", {
                provider: config.searchProvider,
                error: message,
              });
              trace.noteFailure("SearchError", message, true);
              trace.noteRecovery(
                search.name,
                "mock",
                "Primary search failed, so retrieval continued with the mock provider.",
              );
              sources = await searchSources(
                trace,
                input.query,
                "mock",
                maxResults + 3,
                (query) => createMockSearchProvider().search(query, maxResults + 3),
              );
            }
          });

          sources = rankSources(sources, maxResults);
          const documentSources = buildDocumentEvidence(
            input.attachments,
            input.query,
            input.mode,
          );
          if (documentSources.length) sources = [...documentSources, ...sources];
          if (sources.length === 0) {
            throw new Error("No sources found for this query. Try refining it.");
          }

          await emit({ type: "sources", sources, sessionId });
          await trace.stage("reading", async () => {
            await emitStage(emit, "reading", sessionId);
            await sleep(input.mode === "deep" ? 180 : 80);
          });
          await trace.stage("analyzing", async () => {
            await emitStage(emit, "analyzing", sessionId);
            await sleep(input.mode === "deep" ? 200 : 90);
          });

          await emitStage(emit, "synthesizing", sessionId);
          const messages: LlmMessage[] = [
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
          ];

          let answer = "";
          await trace.stage("synthesizing", async () => {
            if (llm.name === "mock") {
              const completion = await completeModel(
                trace,
                "synthesis",
                "mock",
                messages,
                async () => {
                  const text = buildMockAnswer(input.query, sources, input.mode);
                  await streamText(emit, sessionId, text, 4);
                  return { text, model: "mock", stopReason: "stop" };
                },
              );
              answer = completion.text;
              return;
            }

            try {
              const completion = await completeModel(
                trace,
                "synthesis",
                config.models[llm.name === "anthropic" ? "anthropic" : "openai"],
                messages,
                (outbound) =>
                  llm.stream({
                    messages: outbound,
                    onToken: async (token) => {
                      await emit({ type: "token", token, sessionId });
                    },
                  }),
              );
              answer = completion.text;
            } catch (error) {
              if (error instanceof PolicyDenied) throw error;
              const message = error instanceof Error ? error.message : String(error);
              logger.warn("LLM provider failed; falling back to mock synthesis", {
                provider: config.llmProvider,
                error: message,
              });
              trace.noteFailure("ModelError", message, true);
              trace.noteRecovery(
                llm.name,
                "mock",
                "Primary model failed, so synthesis continued with demo text.",
              );
              const completion = await completeModel(
                trace,
                "synthesis",
                "mock",
                messages,
                async () => {
                  const text = buildMockAnswer(input.query, sources, input.mode);
                  await streamText(emit, sessionId, text, 3);
                  return { text, model: "mock", stopReason: "stop" };
                },
              );
              answer = completion.text;
            }
          });

          if (!answer.trim()) {
            throw new Error("The model returned an empty answer. Please try again.");
          }

          trace.observeAnswer(answer, sources);

          let followUps: string[] = [];
          try {
            if (llm.name === "mock") {
              const completion = await completeModel(
                trace,
                "followups",
                "mock",
                [{ role: "user", content: input.query }],
                async () => ({
                  text: buildMockFollowUps(input.query).join("\n"),
                  model: "mock",
                  stopReason: "stop",
                }),
              );
              followUps = completion.text.split("\n").filter(Boolean);
            } else {
              const modelName =
                config.models[llm.name === "anthropic" ? "anthropic" : "openai"];
              const prompted = await completeModel(
                trace,
                "followups",
                modelName,
                [{ role: "user", content: buildFollowUpPrompt(input.query, answer) }],
                async (outbound) => {
                  const prompt = outbound[0]?.content ?? "";
                  const result = prompt.includes("[redacted]")
                    ? await llm.suggestFollowUps(
                        redactSecrets(input.query).text,
                        redactSecrets(answer).text,
                      )
                    : await llm.suggestFollowUps(input.query, answer);
                  return {
                    text: result.followUps.join("\n"),
                    model: result.model ?? modelName,
                    stopReason: result.stopReason,
                    inputTokens: result.inputTokens,
                    outputTokens: result.outputTokens,
                  };
                },
              );
              followUps = prompted.text.split("\n").filter(Boolean);
            }
          } catch (error) {
            if (error instanceof PolicyDenied) throw error;
            const message = error instanceof Error ? error.message : String(error);
            logger.warn("Follow-up generation failed; using defaults", { error: message });
            trace.noteFailure("ModelError", message, true);
            trace.noteRecovery(
              llm.name,
              "mock",
              "Follow-up generation failed, so the default questions were used.",
            );
            followUps = buildMockFollowUps(input.query);
          }

          await emit({ type: "follow_ups", followUps, sessionId });
          await emitStage(emit, "complete", sessionId);
          await emit({ type: "done", sessionId });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unexpected research failure";
          await reportError(message);
          throw error;
        }
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected research failure";
    await reportError(message);
  }
}
