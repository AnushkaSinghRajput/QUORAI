export function corsHeaders(request?: Request) {
  const configured = process.env.CORS_ORIGIN?.trim();
  const origin = request?.headers.get("origin") ?? "";
  const allow =
    !configured || configured === "*"
      ? origin || "*"
      : configured
            .split(",")
            .map((item) => item.trim())
            .includes(origin)
        ? origin
        : configured.split(",")[0]?.trim() || "*";

  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}
