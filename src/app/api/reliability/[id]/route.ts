import { verifyCloudSession } from "@/lib/failproof/cloud";
import { getReliabilityRun, listRunsForSession } from "@/lib/failproof/store";
import { errorResponse, jsonResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const verify = new URL(request.url).searchParams.get("verify") === "1";
  const runs = await listRunsForSession(id);
  const run = runs[0] ?? (await getReliabilityRun(id));
  if (!run && runs.length === 0) {
    return errorResponse("No reliability record for that research session.", 404);
  }

  const sessionId = run?.sessionId ?? id;
  const cloud = verify ? await verifyCloudSession(sessionId) : undefined;
  return jsonResponse({
    ok: true,
    run,
    runs: runs.length > 0 ? runs : run ? [run] : [],
    cloud,
  });
}
