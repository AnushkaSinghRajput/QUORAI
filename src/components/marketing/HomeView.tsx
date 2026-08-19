"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpen,
  FileSearch,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { ReasoningTree } from "@/components/brand/ReasoningTree";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RecentSearches } from "@/components/search/RecentSearches";
import { SearchBar } from "@/components/search/SearchBar";
import { SOLUTIONS } from "@/lib/catalog";
import { beginResearch } from "@/lib/research/client";
import { useResearchStore } from "@/lib/store/research-store";

const CAPABILITIES = [
  {
    icon: Zap,
    title: "Quick Search",
    body: "Grounded answers from top sources in minutes — not hours of tab-hopping.",
  },
  {
    icon: Layers,
    title: "Deep Research",
    body: "Wider retrieval, denser synthesis. Built for decisions that need evidence.",
  },
  {
    icon: BookOpen,
    title: "Cited briefs",
    body: "Every claim traceable. Sources ranked by relevance and credibility.",
  },
  {
    icon: FileSearch,
    title: "File-grounded",
    body: "Drop notes, CSVs, or briefs. QUORAI treats them as primary evidence.",
  },
] as const;

const STATS = [
  { value: "8–12", label: "Sources per deep run" },
  { value: "4", label: "Pipeline stages" },
  { value: "100%", label: "Citation-backed" },
] as const;

export function HomeView() {
  const router = useRouter();
  const mode = useResearchStore((s) => s.mode);
  const setMode = useResearchStore((s) => s.setMode);

  useEffect(() => {
    router.prefetch("/signup");
    router.prefetch("/login");
  }, [router]);

  function launch(
    query: string,
    researchMode = mode,
    attachments?: Parameters<typeof beginResearch>[2],
  ) {
    const id = beginResearch(query, researchMode, attachments);
    queueMicrotask(() => {
      void router.push(`/research/${id}`);
    });
  }

  function pickPath(solutionId: string) {
    const item = SOLUTIONS.find((solution) => solution.id === solutionId);
    if (!item) return;
    launch(item.query, item.mode);
  }

  return (
    <div className="min-h-screen">
      <Header compact />
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
        {/* Hero */}
        <section className="relative text-center">
          <div className="hero-glow" aria-hidden />
          <p className="kicker mb-5">QUORAI Beta</p>
          <h1 className="relative font-display text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-ink sm:text-6xl lg:text-[4.25rem]">
            Generative insights
            <br />
            <span className="glow-text">at your fingertips.</span>
          </h1>
          <p className="relative mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Ask once. Watch the paths branch. Receive a cited brief you can
            share, audit, and build on.
          </p>
          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#console"
              className="inline-flex h-11 min-w-[10.5rem] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1a2744] via-violet to-[#f0c4c8] px-8 text-sm font-semibold tracking-wide text-white shadow-[0_10px_36px_rgba(109,91,184,0.38)] transition hover:brightness-110 hover:shadow-[0_14px_48px_rgba(109,91,184,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/50"
            >
              <Sparkles className="h-4 w-4" />
              Let&apos;s go
            </Link>
            <Link
              href="/product"
              className="inline-flex h-11 items-center rounded-full border border-line bg-bg-muted/50 px-6 text-sm font-medium text-ink-soft transition hover:border-accent/30 hover:text-ink"
            >
              See how it works
            </Link>
          </div>

          {/* Stats strip */}
          <div className="relative mx-auto mt-10 flex max-w-lg flex-wrap justify-center gap-6 sm:gap-10">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Reasoning tree */}
        <section className="mt-10">
          <div className="mb-4 text-center">
            <p className="section-label">Research paths</p>
            <p className="mt-1 text-sm text-ink-faint">
              Click a path to launch a pre-built query
            </p>
          </div>
          <ReasoningTree interactive onPick={pickPath} />
        </section>

        {/* Console */}
        <section id="console" className="mt-12 scroll-mt-24">
          <div className="mb-5 text-center sm:text-left">
            <p className="section-label">Research console</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              What would you like to know?
            </h2>
          </div>
          <SearchBar
            mode={mode}
            onModeChange={setMode}
            onSubmit={(query, attachments) => launch(query, mode, attachments)}
          />
          <div className="mt-6">
            <RecentSearches />
          </div>
        </section>

        {/* Capabilities */}
        <section className="mt-16">
          <div className="gradient-divider mb-10" />
          <div className="text-center">
            <p className="section-label">Capabilities</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Built for consequential work
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                className="surface-interactive rounded-[1.4rem] p-6"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <cap.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {cap.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
