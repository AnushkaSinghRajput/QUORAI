import { countUsers } from "@/lib/auth/store";
import { probeFailproofCapabilities } from "@/lib/failproof/capabilities";
import { publicFailproofStatus } from "@/lib/failproof/store";
import { credentialPresence, getAppConfig } from "@/lib/config";
import { jsonResponse } from "@/lib/http";
import { persistenceMode } from "@/lib/persist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = getAppConfig();
  const users = await countUsers();
  const probe =
    new URL(request.url).searchParams.get("failproof") === "1"
      ? await probeFailproofCapabilities()
      : undefined;

  return jsonResponse({
    ok: true,
    service: "quorai",
    version: "1.0.0",
    time: new Date().toISOString(),
    persistence: persistenceMode(),
    demoMode: config.demoMode,
    liveReady: config.liveReady,
    allowMockFallback: config.allowMockFallback,
    missingCredentials: config.missingCredentials,
    providerCredentials: config.providerCredentials,
    credentialPresence: {
      TAVILY_API_KEY: credentialPresence("TAVILY_API_KEY"),
      OPENAI_API_KEY: credentialPresence("OPENAI_API_KEY"),
      SERPER_API_KEY: credentialPresence("SERPER_API_KEY"),
      ANTHROPIC_API_KEY: credentialPresence("ANTHROPIC_API_KEY"),
      FAILPROOFAI_API_KEY: credentialPresence("FAILPROOFAI_API_KEY"),
      FAILPROOFAI_READ_API_KEY: credentialPresence("FAILPROOFAI_READ_API_KEY"),
      AUTH_SECRET: credentialPresence("AUTH_SECRET"),
    },
    preferred: {
      search: config.preferredSearch,
      llm: config.preferredLlm,
    },
    providers: {
      search: config.searchProvider,
      llm: config.llmProvider,
      searchFallback: config.searchFallback,
      llmFallback: config.llmFallback,
      models: config.models,
    },
    auth: {
      users,
      secretConfigured: config.providerCredentials.authSecret,
    },
    failproof: {
      ...publicFailproofStatus(),
      ...(probe ? { capabilities: probe } : {}),
    },
  });
}
