import { serializeCookie } from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import {
  encodeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/auth/store";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = checkRateLimit(`login:${getClientKey(request)}`, 12, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many login attempts. Try again shortly." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid credentials" },
      { status: 400 },
    );
  }

  const user = await findUserByEmail(parsed.data.email);
  const valid =
    user && (await verifyPassword(parsed.data.password, user.passwordHash));

  if (!user || !valid) {
    return Response.json(
      { error: "Email or password is incorrect." },
      { status: 401 },
    );
  }

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
