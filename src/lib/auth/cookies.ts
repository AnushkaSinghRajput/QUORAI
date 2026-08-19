import { sessionCookieOptions } from "@/lib/auth/session";

export function serializeCookie(
  name: string,
  value: string,
  options: ReturnType<typeof sessionCookieOptions> & { maxAge?: number },
) {
  const parts = [
    `${name}=${value}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge ?? 0}`,
    `SameSite=${options.sameSite}`,
  ];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie(name: string) {
  return serializeCookie(name, "", { ...sessionCookieOptions(0), maxAge: 0 });
}
