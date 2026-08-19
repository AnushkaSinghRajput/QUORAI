import { jsonResponse } from "@/lib/http";
import { PRODUCT_FEATURES } from "@/lib/site-content";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse({ features: PRODUCT_FEATURES });
}
