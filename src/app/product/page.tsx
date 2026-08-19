import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  Code2,
  FileUp,
  Layers,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PRODUCT_FEATURES } from "@/lib/site-content";

const FEATURE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  console: Terminal,
  deep: Layers,
  upload: FileUp,
  models: Sparkles,
  api: Code2,
};

export const metadata: Metadata = {
  title: "Product",
};

export default function ProductPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="kicker">Product</p>
        <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          One query. Many paths.{" "}
          <span className="glow-text">A cited brief.</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          QUORAI retrieves the live web, scores every source, and streams a
          synthesis you can audit, not a chatbot improvisation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/#console"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#1a2744] via-violet to-[#f0c4c8] px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(109,91,184,0.35)] transition hover:brightness-110"
          >
            <Terminal className="h-4 w-4" />
            Open console
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-full border border-line bg-bg-muted/50 px-5 text-sm font-semibold text-ink transition hover:border-accent/30"
          >
            Join beta
          </Link>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {PRODUCT_FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.id] ?? Sparkles;
            return (
              <Link
                key={feature.id}
                href={feature.href}
                className="surface-interactive group rounded-[1.4rem] p-6"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl text-ink">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {feature.body}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
