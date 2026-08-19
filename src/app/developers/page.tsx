import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Developers",
};

const ENDPOINTS = [
  { method: "GET", path: "/api", note: "Discovery index" },
  { method: "GET", path: "/api/health", note: "Liveness + providers" },
  { method: "GET", path: "/api/catalog", note: "Solutions and model cards" },
  { method: "POST", path: "/api/research", note: "SSE research pipeline" },
  { method: "GET", path: "/api/briefs/:id", note: "Fetch a persisted brief" },
  { method: "GET", path: "/api/briefs", note: "List briefs (session or API key)" },
  { method: "POST", path: "/api/leads/waitlist", note: "Join beta waitlist" },
  { method: "POST", path: "/api/leads/contact", note: "Contact desk" },
  { method: "GET", path: "/api/content/product", note: "Product features" },
  { method: "GET", path: "/api/content/company", note: "Company copy" },
  { method: "GET", path: "/api/blog", note: "Blog index" },
  { method: "GET", path: "/api/faq", note: "FAQ + helpful votes" },
  { method: "POST", path: "/api/auth/signup", note: "Create account" },
  { method: "POST", path: "/api/auth/login", note: "Session cookie" },
  { method: "GET", path: "/api/auth/me", note: "Current user" },
];

export default function DevelopersPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#f0c4c8]">
          QUORAI API
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink">
          Backend, ready to call.
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Same routes the product uses: waitlist, auth, catalog, and streaming
          research. Demo mode works with no vendor keys.
        </p>

        <pre className="surface mt-8 overflow-x-auto rounded-[1.4rem] p-5 text-xs leading-relaxed text-ink-soft">
{`curl -N http://localhost:3000/api/research \\
  -H "Content-Type: application/json" \\
  -d '{"query":"What changed in the EU AI Act?","mode":"deep"}'`}
        </pre>

        <div className="mt-8 overflow-hidden rounded-[1.4rem] border border-white/12">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/30 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              <tr>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Use</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((item) => (
                <tr key={item.path} className="border-t border-white/10">
                  <td className="px-4 py-3 font-mono text-xs text-[#f0c4c8]">
                    {item.method}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {item.path}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm text-ink-soft">
          Optional: set <code className="text-ink">QUORAI_API_KEY</code> and send{" "}
          <code className="text-ink">Authorization: Bearer …</code> for list and
          admin routes.{" "}
          <Link href="/api/health" className="text-cyan hover:underline">
            Check health
          </Link>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
