import { countUsers } from "@/lib/auth/store";
import { getAppConfig } from "@/lib/config";
import { jsonResponse } from "@/lib/http";
import { persistenceMode } from "@/lib/persist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = getAppConfig();
  const users = await countUsers();

  return jsonResponse({
    ok: true,
    service: "quorai",
    version: "1.0.0",
    time: new Date().toISOString(),
    persistence: persistenceMode(),
    demoMode: config.demoMode,
    providers: {
      search: config.searchProvider,
      llm: config.llmProvider,
      models: config.models,
    },
    auth: {
      users,
      secretConfigured: Boolean(process.env.AUTH_SECRET?.trim()),
    },
  });
}
