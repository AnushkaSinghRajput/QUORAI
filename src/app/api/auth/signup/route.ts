import { nanoid } from "nanoid";
import { serializeCookie } from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import {
  encodeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { createUser, findUserByEmail } from "@/lib/auth/store";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = checkRateLimit(`signup:${getClientKey(request)}`, 8, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many signup attempts. Try again shortly." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup details" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const existing = await findUserByEmail(email);
  if (existing) {
    return Response.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const user = await createUser({
    id: nanoid(12),
    name,
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  });

  logger.info("User signed up", { userId: user.id });

  const token = encodeSession({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  return Response.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    },
    {
      status: 201,
      headers: {
        "Set-Cookie": serializeCookie(
          SESSION_COOKIE,
          token,
          sessionCookieOptions(),
        ),
      },
    },
  );
}
