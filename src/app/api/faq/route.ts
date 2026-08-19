import { errorResponse, jsonResponse } from "@/lib/http";
import { loadCollection, saveCollection } from "@/lib/persist";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { FAQ_ITEMS } from "@/lib/site-content";
import { faqHelpfulSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const votes = await loadCollection<Record<string, number>>("faq-votes", {});
  return jsonResponse({
    items: FAQ_ITEMS.map((item) => ({
      ...item,
      helpful: votes[item.id] ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const limit = checkRateLimit(`faq:${getClientKey(request)}`, 20, 60_000);
  if (!limit.allowed) {
    return errorResponse("Too many votes.", 429);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const parsed = faqHelpfulSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }

  const item = FAQ_ITEMS.find((entry) => entry.id === parsed.data.id);
  if (!item) return errorResponse("Unknown question.", 404);

  const votes = await loadCollection<Record<string, number>>("faq-votes", {});
  votes[parsed.data.id] = (votes[parsed.data.id] ?? 0) + 1;
  await saveCollection("faq-votes", votes);
  return jsonResponse({ ok: true, id: parsed.data.id, helpful: votes[parsed.data.id] });
}
