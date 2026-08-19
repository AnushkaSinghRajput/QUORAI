import { errorResponse, isServiceRequest, jsonResponse } from "@/lib/http";
import { listLeads } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.QUORAI_API_KEY?.trim()) {
    return errorResponse("Set QUORAI_API_KEY to enable the admin leads API.", 501);
  }
  if (!isServiceRequest(request)) {
    return errorResponse("Unauthorized.", 401);
  }

  const leads = await listLeads();
  return jsonResponse(leads);
}
