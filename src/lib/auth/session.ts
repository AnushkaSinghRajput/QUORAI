import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionPayload } from "@/lib/auth/types";

export const SESSION_COOKIE = "quorai_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function resolveSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;
  if (
    /^(your_|change-me|changeme|placeholder|example)/i.test(secret) ||
    secret === "quorai-research-dev-secret"
  ) {
    return null;
  }
  return secret;
}

function requireSecret() {
  const secret = resolveSecret();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is required to sign session cookies. Set a real secret in .env.local or Vercel Production.",
    );
  }
  return secret;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function encodeSession(payload: Omit<SessionPayload, "exp">) {
  const secret = requireSecret();
  const body: SessionPayload = {
    ...payload,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const secret = resolveSecret();
  if (!secret) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload.sub || !payload.email || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function readSessionFromRequest(request: Request): SessionPayload | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const token = match?.slice(SESSION_COOKIE.length + 1);
  return decodeSession(token);
}
