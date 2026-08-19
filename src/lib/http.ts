import { readSessionFromRequest } from "@/lib/auth/session";

export function jsonResponse(
  body: unknown,
  status = 200,
  extra?: HeadersInit,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extra,
    },
  });
}

export function errorResponse(error: string, status = 400, extra?: HeadersInit) {
  return jsonResponse({ ok: false, error }, status, extra);
}

export function isServiceRequest(request: Request) {
  const key = process.env.QUORAI_API_KEY?.trim();
  if (!key) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${key}`;
}

export function getActor(request: Request) {
  const session = readSessionFromRequest(request);
  const service = isServiceRequest(request);
  return {
    userId: session?.sub ?? (service ? "service" : null),
    email: session?.email ?? null,
    service,
    session,
  };
}
