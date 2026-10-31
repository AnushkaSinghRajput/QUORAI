import { nanoid } from "nanoid";
import { credentialsBlockerMessage, getAppConfig } from "@/lib/config";
import { buildDocumentEvidence, documentHint } from "@/lib/documents";
import { PolicyDenied, redactSecrets } from "@/lib/failproof/guards";
import {
  withResearchSession,
  type ModelCallResult,
  type ResearchTrace,
} from "@/lib/failproof/trace";
import { logger } from "@/lib/logger";
import { buildMockAnswer, buildMockFollowUps } from "@/lib/mock/data";
import { createAnthropicProvider } from "@/lib/providers/llm/anthropic";
import { getLlmProvider } from "@/lib/providers/llm";
import { createMockLlmProvider } from "@/lib/providers/llm/mock";
import { createOpenAIProvider } from "@/lib/providers/llm/openai";
import type { LlmMessage, LlmProvider } from "@/lib/providers/llm/types";
import { getSearchProvider } from "@/lib/providers/search";
import { createMockSearchProvider } from "@/lib/providers/search/mock";
import { createSerperProvider } from "@/lib/providers/search/serper";
import { createTavilyProvider } from "@/lib/providers/search/tavily";
import type { SearchProvider } from "@/lib/providers/search/types";
import {
  buildFollowUpPrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from "@/lib/research/prompts";
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

function searchChain(config: ReturnType<typeof getAppConfig>): SearchProvider[] {
  const chain: SearchProvider[] = [];
  const primary = getSearchProvider();
  if (primary.name !== "mock") chain.push(primary);
  if (
    config.keys.serper &&
    !chain.some((provider) => provider.name === "serper")
  ) {
    chain.push(createSerperProvider(config.keys.serper));
  }
  if (
    config.keys.tavily &&
    !chain.some((provider) => provider.name === "tavily")
  ) {
    chain.push(createTavilyProvider(config.keys.tavily));
  }
  if (config.allowMockFallback) chain.push(createMockSearchProvider());
  return chain;
}

function llmChain(config: ReturnType<typeof getAppConfig>): LlmProvider[] {
  const chain: LlmProvider[] = [];
  const primary = getLlmProvider();
  if (primary.name !== "mock") chain.push(primary);
  if (
    config.keys.anthropic &&
    !chain.some((provider) => provider.name === "anthropic")
  ) {
    chain.push(
      createAnthropicProvider(config.keys.anthropic, config.models.anthropic),
    );
  }
  if (
    config.keys.openai &&
    !chain.some((provider) => provider.name === "openai")
  ) {
    chain.push(createOpenAIProvider(config.keys.openai, config.models.openai));
  }
  if (config.allowMockFallback) chain.push(createMockLlmProvider());
  return chain;
}

export async function runResearchPipeline(input: RunResearchInput, emit: Emit) {
  const sessionId = input.sessionId || nanoid(12);
  const config = getAppConfig();
  const maxResults = input.mode === "deep" ? 10 : 5;
  let reported = false;
  let usedSearch = "none";
  let usedLlm = "none";
  let demoSynthesis = false;

  const reportError = async (message: string) => {
    if (reported) return;
    reported = true;
    logger.error("Research failed", { message, sessionId });
    await emit({ type: "error", error: message, sessionId });
    await emit({ type: "stage", stage: "error", sessionId });
  };

  if (!config.liveReady && !config.allowMockFallback) {
    const blocker =
      credentialsBlockerMessage(config) ??
      "Live providers are not configured.";
    // Still open a Failproof session so credential blocks produce real Cloud events.
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
          await emit({
            type: "meta",
            sessionId,
            demoMode: true,
            liveReady: false,
            searchProvider: config.searchProvider,
            llmProvider: config.llmProvider,
            missingCredentials: config.missingCredentials,
          });
          trace.noteFailure("CredentialsMissing", blocker, false);
          await reportError(blocker);
          throw new Error(blocker);
        },
      );
    } catch {
      // reportError already streamed the user-facing failure.
    }
    return;
  }

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
          await emit({
            type: "meta",
            sessionId,
            demoMode: config.demoMode,
            liveReady: config.liveReady,
            searchProvider: config.searchProvider,
            llmProvider: config.llmProvider,
            missingCredentials: config.missingCredentials,
          });
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
            const providers = searchChain(config);
            if (providers.length === 0) {
              throw new Error(
                credentialsBlockerMessage(config) ??
                  "No search provider is available.",
              );
            }
            let lastError: Error | null = null;
            for (const provider of providers) {
              try {
                sources = await searchSources(
                  trace,
                  searchQuery,
                  provider.name,
                  maxResults + 3,
                  (query) => provider.search(query, maxResults + 3),
                );
                usedSearch = provider.name;
                if (provider.name === "mock") demoSynthesis = true;
                lastError = null;
                break;
              } catch (error) {
                if (error instanceof PolicyDenied) throw error;
                lastError =
                  error instanceof Error ? error : new Error(String(error));
                logger.warn("Search provider failed; trying next fallback", {
                  provider: provider.name,
                  error: lastError.message,
                });
                trace.noteFailure("SearchError", lastError.message, true);
                const next = providers[providers.indexOf(provider) + 1];
                if (next) {
                  trace.noteRecovery(
                    provider.name,
                    next.name,
                    `Search via ${provider.name} failed; trying ${next.name}.`,
                  );
                }
              }
            }
            if (lastError) throw lastError;
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
            const providers = llmChain(config);
            if (providers.length === 0) {
              throw new Error(
                credentialsBlockerMessage(config) ??
                  "No LLM provider is available.",
              );
            }
            let lastError: Error | null = null;
            for (const provider of providers) {
              try {
                if (provider.name === "mock") {
                  if (!config.allowMockFallback) {
                    throw new Error(
                      "Mock synthesis is disabled. Configure OPENAI_API_KEY (or ANTHROPIC_API_KEY).",
                    );
                  }
                  demoSynthesis = true;
                  const completion = await completeModel(
                    trace,
                    "synthesis",
                    "mock",
                    messages,
                    async () => {
                      const text = [
                        "> **Demo mode** — this brief used mock synthesis, not a live model.",
                        "",
                        buildMockAnswer(input.query, sources, input.mode),
                      ].join("\n");
                      await streamText(emit, sessionId, text, 4);
                      return { text, model: "mock", stopReason: "stop" };
                    },
                  );
                  answer = completion.text;
                  usedLlm = "mock";
                  lastError = null;
                  break;
                }

                const modelName =
                  provider.name === "anthropic"
                    ? config.models.anthropic
                    : config.models.openai;
                const completion = await completeModel(
                  trace,
                  "synthesis",
                  modelName,
                  messages,
                  (outbound) =>
                    provider.stream({
                      messages: outbound,
                      onToken: async (token) => {
                        await emit({ type: "token", token, sessionId });
                      },
                    }),
                );
                answer = completion.text;
                usedLlm = provider.name;
                lastError = null;
                break;
              } catch (error) {
                if (error instanceof PolicyDenied) throw error;
                lastError =
                  error instanceof Error ? error : new Error(String(error));
                logger.warn("LLM provider failed; trying next fallback", {
                  provider: provider.name,
                  error: lastError.message,
                });
                trace.noteFailure("ModelError", lastError.message, true);
                const next = providers[providers.indexOf(provider) + 1];
                if (next) {
                  trace.noteRecovery(
                    provider.name,
                    next.name,
                    `Model ${provider.name} failed; trying ${next.name}.`,
                  );
                }
              }
            }
            if (lastError) throw lastError;
          });

          if (!answer.trim()) {
            throw new Error("The model returned an empty answer. Please try again.");
          }

          trace.observeAnswer(answer, sources);

          let followUps: string[] = [];
          try {
            const providers = llmChain(config).filter((provider) =>
              demoSynthesis ? provider.name === "mock" : provider.name !== "mock",
            );
            const provider = providers[0] ?? (config.allowMockFallback ? createMockLlmProvider() : null);
            if (!provider) {
              followUps = [];
            } else if (provider.name === "mock") {
              followUps = buildMockFollowUps(input.query);
            } else {
              const modelName =
                provider.name === "anthropic"
                  ? config.models.anthropic
                  : config.models.openai;
              const prompted = await completeModel(
                trace,
                "followups",
                modelName,
                [{ role: "user", content: buildFollowUpPrompt(input.query, answer) }],
                async () => {
                  const result = await provider.suggestFollowUps(
                    input.query,
                    answer,
                  );
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
            const message =
              error instanceof Error ? error.message : String(error);
            logger.warn("Follow-up generation failed; using defaults", {
              error: message,
            });
            trace.noteFailure("ModelError", message, true);
            followUps = config.allowMockFallback
              ? buildMockFollowUps(input.query)
              : [];
          }

          await emit({ type: "follow_ups", followUps, sessionId });
          await emit({
            type: "meta",
            sessionId,
            demoMode: demoSynthesis || usedSearch === "mock" || usedLlm === "mock",
            liveReady: usedSearch !== "mock" && usedLlm !== "mock",
            searchProvider: usedSearch,
            llmProvider: usedLlm,
            missingCredentials: config.missingCredentials,
          });
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
