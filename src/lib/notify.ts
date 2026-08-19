import { logger } from "@/lib/logger";

export async function notifyLead(kind: "waitlist" | "contact", payload: unknown) {
  const url = process.env.CONTACT_WEBHOOK_URL?.trim();
  if (!url) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "QUORAI",
        kind,
        payload,
        at: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      logger.warn("Lead webhook failed", { status: response.status, kind });
    }
  } catch (error) {
    logger.warn("Lead webhook error", {
      kind,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
