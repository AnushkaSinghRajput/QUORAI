import { LEVEL_META, MODEL_CARDS, SOLUTIONS } from "@/lib/catalog";
import { getAppConfig } from "@/lib/config";
import { jsonResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const config = getAppConfig();
  return jsonResponse({
    solutions: SOLUTIONS.map((item) => ({
      id: item.id,
      level: item.level,
      title: item.title,
      mode: item.mode,
      query: item.query,
    })),
    levels: LEVEL_META,
    models: MODEL_CARDS,
    runtime: {
      searchProvider: config.searchProvider,
      llmProvider: config.llmProvider,
      demoMode: config.demoMode,
    },
  });
}
