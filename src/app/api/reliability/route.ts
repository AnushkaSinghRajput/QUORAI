import { errorResponse, getActor, jsonResponse } from "@/lib/http";
import {
  listReliabilityRuns,
  publicFailproofStatus,
  summarizeReliability,
  type ReliabilityRun,
} from "@/lib/failproof/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redactRun(run: ReliabilityRun): ReliabilityRun {
  const query =
    run.query.length > 64 ? `${run.query.slice(0, 61)}…` : run.query;
  return { ...run, query };
}

export async function GET(request: Request) {
  try {
    const actor = getActor(request);
    const privileged = Boolean(actor.session || actor.service);
    const runs = await listReliabilityRuns();
    const visible = privileged ? runs : runs.map(redactRun);
    return jsonResponse({
      ok: true,
      failproof: publicFailproofStatus(),
      metrics: summarizeReliability(runs),
      runs: visible,
      redacted: !privileged,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Could not read reliability records.",
      500,
    );
  }
}
