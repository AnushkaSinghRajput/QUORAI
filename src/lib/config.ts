export type SearchProviderName = "mock" | "tavily" | "serper";
export type LlmProviderName = "mock" | "openai" | "anthropic";

function env(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

/** Reject common template placeholders so they are never treated as live credentials. */
function liveSecret(key: string): string | undefined {
  const value = env(key);
  if (!value) return undefined;
  if (
    /^(your_|change-me|changeme|xxx+|todo|placeholder|example|replace)/i.test(
      value,
    ) ||
    /your_[a-z0-9_]+_key/i.test(value) ||
    value === "sk-..." ||
    value.includes("your_openai") ||
    value.includes("your_tavily")
  ) {
    return undefined;
  }
  return value;
}

function flag(key: string, fallback = false) {
  const value = env(key)?.toLowerCase();
  if (!value) return fallback;
  return value === "1" || value === "true" || value === "yes";
}

export function getAppConfig() {
  const tavilyKey = liveSecret("TAVILY_API_KEY");
  const serperKey = liveSecret("SERPER_API_KEY");
  const openaiKey = liveSecret("OPENAI_API_KEY");
  const anthropicKey = liveSecret("ANTHROPIC_API_KEY");
  const failproofKey = liveSecret("FAILPROOFAI_API_KEY");

  const preferredSearch = (env("SEARCH_PROVIDER") ?? "tavily") as
    | SearchProviderName
    | "auto";
  const preferredLlm = (env("LLM_PROVIDER") ?? "openai") as
    | LlmProviderName
    | "auto";

  const missing: string[] = [];
  if (
    (preferredSearch === "tavily" || preferredSearch === "auto") &&
    !tavilyKey &&
    preferredSearch === "tavily"
  ) {
    missing.push("TAVILY_API_KEY");
  }
  if (preferredSearch === "serper" && !serperKey) missing.push("SERPER_API_KEY");
  if (
    (preferredLlm === "openai" || preferredLlm === "auto") &&
    preferredLlm === "openai" &&
    !openaiKey
  ) {
    missing.push("OPENAI_API_KEY");
  }
  if (preferredLlm === "anthropic" && !anthropicKey) {
    missing.push("ANTHROPIC_API_KEY");
  }
  if (!failproofKey) missing.push("FAILPROOFAI_API_KEY");
  if (!liveSecret("AUTH_SECRET") && !env("AUTH_SECRET")) {
    missing.push("AUTH_SECRET");
  } else if (!liveSecret("AUTH_SECRET") && env("AUTH_SECRET")) {
    missing.push("AUTH_SECRET (replace placeholder)");
  }

  // Primary → optional fallback chain.
  let searchProvider: SearchProviderName = "mock";
  if (preferredSearch === "mock") {
    searchProvider = "mock";
  } else if (preferredSearch === "tavily" && tavilyKey) {
    searchProvider = "tavily";
  } else if (preferredSearch === "serper" && serperKey) {
    searchProvider = "serper";
  } else if (preferredSearch === "auto") {
    if (tavilyKey) searchProvider = "tavily";
    else if (serperKey) searchProvider = "serper";
  } else if (tavilyKey) {
    searchProvider = "tavily";
  } else if (serperKey) {
    searchProvider = "serper";
  }

  let llmProvider: LlmProviderName = "mock";
  if (preferredLlm === "mock") {
    llmProvider = "mock";
  } else if (preferredLlm === "openai" && openaiKey) {
    llmProvider = "openai";
  } else if (preferredLlm === "anthropic" && anthropicKey) {
    llmProvider = "anthropic";
  } else if (preferredLlm === "auto") {
    if (openaiKey) llmProvider = "openai";
    else if (anthropicKey) llmProvider = "anthropic";
  } else if (openaiKey) {
    llmProvider = "openai";
  } else if (anthropicKey) {
    llmProvider = "anthropic";
  }

  const wantsLiveSearch =
    preferredSearch !== "mock" &&
    (preferredSearch === "auto" ||
      preferredSearch === "tavily" ||
      preferredSearch === "serper");
  const wantsLiveLlm =
    preferredLlm !== "mock" &&
    (preferredLlm === "auto" ||
      preferredLlm === "openai" ||
      preferredLlm === "anthropic");

  const liveSearchReady = searchProvider !== "mock";
  const liveLlmReady = llmProvider !== "mock";
  const liveReady = liveSearchReady && liveLlmReady;

  const allowMockFallback =
    preferredSearch === "mock" ||
    preferredLlm === "mock" ||
    flag("ALLOW_MOCK_FALLBACK", false);

  const demoMode = !liveReady;

  return {
    preferredSearch,
    preferredLlm,
    searchProvider,
    llmProvider,
    searchFallback: serperKey && searchProvider === "tavily" ? ("serper" as const) : null,
    llmFallback:
      anthropicKey && llmProvider === "openai" ? ("anthropic" as const) : null,
    demoMode,
    liveReady,
    allowMockFallback,
    missingCredentials: missing,
    providerCredentials: {
      tavily: Boolean(tavilyKey),
      serper: Boolean(serperKey),
      openai: Boolean(openaiKey),
      anthropic: Boolean(anthropicKey),
      failproof: Boolean(failproofKey),
      authSecret: Boolean(liveSecret("AUTH_SECRET")),
    },
    wantsLiveSearch,
    wantsLiveLlm,
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

/** Non-secret status for operator diagnostics (never returns values). */
export function credentialPresence(
  key: string,
): "missing" | "placeholder" | "configured" {
  const value = env(key);
  if (!value) return "missing";
  if (!liveSecret(key)) return "placeholder";
  return "configured";
}

export function credentialsBlockerMessage(config: AppConfig = getAppConfig()) {
  const needed = [
    !config.providerCredentials.tavily &&
    (config.preferredSearch === "tavily" || config.preferredSearch === "auto")
      ? "TAVILY_API_KEY"
      : null,
    !config.providerCredentials.openai &&
    (config.preferredLlm === "openai" || config.preferredLlm === "auto")
      ? "OPENAI_API_KEY"
      : null,
  ].filter(Boolean) as string[];

  if (needed.length === 0 && !config.liveReady) {
    return "Live research providers are not ready. Check SEARCH_PROVIDER / LLM_PROVIDER and their API keys.";
  }
  if (needed.length === 0) return null;
  return `Live research requires ${needed.join(" and ")}. Add them to .env.local (local) and Vercel Production, then restart. Mock answers are disabled unless ALLOW_MOCK_FALLBACK=1.`;
}
