import { jsonResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse({
    name: "QUORAI API",
    version: "1.0.0",
    product: "AI-powered web research",
    docs: "/developers",
    endpoints: {
      health: { method: "GET", path: "/api/health" },
      catalog: { method: "GET", path: "/api/catalog" },
      research: {
        method: "POST",
        path: "/api/research",
        stream: "text/event-stream",
      },
      brief: { method: "GET", path: "/api/briefs/:id" },
      briefs: { method: "GET", path: "/api/briefs" },
      waitlist: { method: "POST", path: "/api/leads/waitlist" },
      contact: { method: "POST", path: "/api/leads/contact" },
      product: { method: "GET", path: "/api/content/product" },
      company: { method: "GET", path: "/api/content/company" },
      blog: { method: "GET", path: "/api/blog" },
      faq: { method: "GET", path: "/api/faq" },
      signup: { method: "POST", path: "/api/auth/signup" },
      login: { method: "POST", path: "/api/auth/login" },
      logout: { method: "POST", path: "/api/auth/logout" },
      me: { method: "GET", path: "/api/auth/me" },
    },
  });
}
