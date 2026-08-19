import { nanoid } from "nanoid";
import { applyBriefEvent, upsertBrief } from "@/lib/briefs";
import { getActor } from "@/lib/http";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { runResearchPipeline } from "@/lib/research/pipeline";
import type { StreamEvent } from "@/lib/types";
import { researchRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = Number(process.env.RESEARCH_RATE_LIMIT ?? 30);
const RATE_WINDOW_MS = Number(process.env.RESEARCH_RATE_WINDOW_MS ?? 60_000);

export async function POST(request: Request) {
  const clientKey = getClientKey(request);
  const actor = getActor(request);
  const limit = checkRateLimit(
    `research:${actor.userId ?? clientKey}`,
    Number.isFinite(RATE_LIMIT) ? RATE_LIMIT : 30,
    Number.isFinite(RATE_WINDOW_MS) ? RATE_WINDOW_MS : 60_000,
  );

  if (!limit.allowed) {
    logger.warn("Research rate limit exceeded", { clientKey });
    return Response.json(
      {
        error: "Too many research requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000)),
          ),
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = researchRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const sessionId = parsed.data.sessionId || nanoid(12);
  await upsertBrief({
    id: sessionId,
    query: parsed.data.query,
    mode: parsed.data.mode,
    userId: actor.userId,
    attachmentNames: parsed.data.attachments?.map((file) => file.name),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = async (event: StreamEvent) => {
        const id = event.sessionId || sessionId;
        if (id) await applyBriefEvent(id, event);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        logger.info("Research started", {
          mode: parsed.data.mode,
          queryLength: parsed.data.query.length,
          userId: actor.userId,
        });
        await runResearchPipeline({ ...parsed.data, sessionId }, send);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Pipeline failure";
        logger.error("Research pipeline crashed", { message });
        await send({ type: "error", error: message, sessionId });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-RateLimit-Limit": String(limit.limit),
      "X-RateLimit-Remaining": String(limit.remaining),
    },
  });
}
