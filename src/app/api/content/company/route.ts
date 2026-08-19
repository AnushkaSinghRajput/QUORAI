import { jsonResponse } from "@/lib/http";
import { COMPANY } from "@/lib/site-content";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse({ company: COMPANY });
}
