import { nanoid } from "nanoid";
import { getReliabilityRun } from "@/lib/failproof/store";
import { jsonResponse, errorResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { runResearchPipeline } from "@/lib/research/pipeline";
import type { StreamEvent } from "@/lib/types";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  query: z.string().trim().min(8).max(320),
  mode: z.enum(["quick", "deep"]).default("quick"),
});

async function collectRun(
  query: string,
  mode: "quick" | "deep",
  protection: "protected" | "unprotected",
) {
  const sessionId = `cmp-${protection}-${nanoid(8)}`;
  let answer = "";
  const sources: NonNullable<StreamEvent["sources"]> = [];
  let error: string | undefined;

  await runResearchPipeline(
    { query, mode, sessionId, protection },
    async (event) => {
      if (event.type === "token" && event.token) answer += event.token;
      if (event.type === "sources" && event.sources) {
        sources.splice(0, sources.length, ...event.sources);
      }
      if (event.type === "error") error = event.error;
    },
  );

  const run = await getReliabilityRun(sessionId);
  return {
    sessionId,
    protection,
    answer,
    sources,
    error,
    run,
  };
}

export async function POST(request: Request) {
  const limit = checkRateLimit(`demo:${getClientKey(request)}`, 6, 60_000);
  if (!limit.allowed) {
    return errorResponse("Too many comparison runs. Wait a moment.", 429);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }

  try {
    logger.info("Protected vs unprotected demo started", {
      queryLength: parsed.data.query.length,
      mode: parsed.data.mode,
    });
    // Sequential so spool/ship and local reliability records stay orderly.
    const unprotected = await collectRun(
      parsed.data.query,
      parsed.data.mode,
      "unprotected",
    );
    const protectedRun = await collectRun(
      parsed.data.query,
      parsed.data.mode,
      "protected",
    );
    return jsonResponse({
      ok: true,
      query: parsed.data.query,
      mode: parsed.data.mode,
      unprotected,
      protected: protectedRun,
    });
  } catch (error) {
    logger.error("Demo compare failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(
      error instanceof Error ? error.message : "Comparison failed",
      500,
    );
  }
}
