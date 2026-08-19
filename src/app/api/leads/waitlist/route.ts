import { addWaitlistEmail } from "@/lib/leads";
import { logger } from "@/lib/logger";
import { notifyLead } from "@/lib/notify";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = checkRateLimit(`waitlist:${getClientKey(request)}`, 8, 60_000);
  if (!limit.allowed) {
    return Response.json({ error: "Too many attempts." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 },
    );
  }

  const result = await addWaitlistEmail(parsed.data.email);
  if (!result.already) {
    await notifyLead("waitlist", { email: parsed.data.email });
  }
  logger.info("Waitlist signup", { email: parsed.data.email });
  return Response.json(
    {
      ok: true,
      already: result.already,
      message: result.already
        ? "You’re already on the list."
        : "You’re on the list. We’ll write when the next cohort opens.",
    },
    { status: result.already ? 200 : 201 },
  );
}
