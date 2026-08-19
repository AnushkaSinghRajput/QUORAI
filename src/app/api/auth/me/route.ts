import { readSessionFromRequest } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return Response.json({ user: null }, { status: 200 });
  }

  const user = await findUserById(session.sub);
  if (!user) {
    return Response.json({ user: null }, { status: 200 });
  }

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}
