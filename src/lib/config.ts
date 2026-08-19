export type SearchProviderName = "mock" | "tavily" | "serper";
export type LlmProviderName = "mock" | "openai" | "anthropic";

function env(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function getAppConfig() {
  const tavilyKey = env("TAVILY_API_KEY");
  const serperKey = env("SERPER_API_KEY");
  const openaiKey = env("OPENAI_API_KEY");
  const anthropicKey = env("ANTHROPIC_API_KEY");

  const preferredSearch = (env("SEARCH_PROVIDER") ??
    "auto") as SearchProviderName | "auto";
  const preferredLlm = (env("LLM_PROVIDER") ??
    "auto") as LlmProviderName | "auto";

  let searchProvider: SearchProviderName = "mock";
  if (preferredSearch === "auto") {
    if (tavilyKey) searchProvider = "tavily";
    else if (serperKey) searchProvider = "serper";
  } else if (preferredSearch === "tavily" && tavilyKey) {
    searchProvider = "tavily";
  } else if (preferredSearch === "serper" && serperKey) {
    searchProvider = "serper";
  } else if (preferredSearch === "mock") {
    searchProvider = "mock";
  }

  let llmProvider: LlmProviderName = "mock";
  if (preferredLlm === "auto") {
    if (openaiKey) llmProvider = "openai";
    else if (anthropicKey) llmProvider = "anthropic";
  } else if (preferredLlm === "openai" && openaiKey) {
    llmProvider = "openai";
  } else if (preferredLlm === "anthropic" && anthropicKey) {
    llmProvider = "anthropic";
  } else if (preferredLlm === "mock") {
    llmProvider = "mock";
  }

  return {
    searchProvider,
    llmProvider,
    demoMode: searchProvider === "mock" || llmProvider === "mock",
    keys: {
      tavily: tavilyKey,
      serper: serperKey,
      openai: openaiKey,
      anthropic: anthropicKey,
    },
    models: {
      openai: env("OPENAI_MODEL") ?? "gpt-4o-mini",
      anthropic: env("ANTHROPIC_MODEL") ?? "claude-3-5-haiku-latest",
    },
  };
}

export type AppConfig = ReturnType<typeof getAppConfig>;
