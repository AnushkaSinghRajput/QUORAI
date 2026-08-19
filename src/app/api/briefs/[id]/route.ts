import { getBrief } from "@/lib/briefs";
import { errorResponse, jsonResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const brief = await getBrief(id);
  if (!brief) {
    return errorResponse("Brief not found.", 404);
  }
  return jsonResponse({ brief });
}
