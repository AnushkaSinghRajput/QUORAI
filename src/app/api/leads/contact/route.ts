import { addContact } from "@/lib/leads";
import { logger } from "@/lib/logger";
import { notifyLead } from "@/lib/notify";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = checkRateLimit(`contact:${getClientKey(request)}`, 6, 60_000);
  if (!limit.allowed) {
    return Response.json({ error: "Too many messages." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid form" },
      { status: 400 },
    );
  }

  const record = await addContact(parsed.data);
  await notifyLead("contact", record);
  logger.info("Contact received", { email: parsed.data.email, id: record.id });
  return Response.json(
    { ok: true, id: record.id, message: "Received. A human will reply from the QUORAI desk." },
    { status: 201 },
  );
}
