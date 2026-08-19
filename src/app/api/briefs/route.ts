import { listBriefs } from "@/lib/briefs";
import { errorResponse, getActor, jsonResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = getActor(request);
  if (!actor.userId) {
    return errorResponse("Sign in or pass Authorization: Bearer <QUORAI_API_KEY>.", 401);
  }

  const briefs = await listBriefs(actor.service ? undefined : actor.userId);
  return jsonResponse({
    briefs: briefs.map((brief) => ({
      id: brief.id,
      query: brief.query,
      mode: brief.mode,
      stage: brief.stage,
      updatedAt: brief.updatedAt,
      createdAt: brief.createdAt,
    })),
  });
}
