import { errorResponse, jsonResponse } from "@/lib/http";
import {
  listReliabilityRuns,
  publicFailproofStatus,
  summarizeReliability,
} from "@/lib/failproof/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const runs = await listReliabilityRuns();
    return jsonResponse({
      ok: true,
      failproof: publicFailproofStatus(),
      metrics: summarizeReliability(runs),
      runs,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Could not read reliability records.",
      500,
    );
  }
}
