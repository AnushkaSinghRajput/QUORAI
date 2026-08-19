"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  FileSearch,
  Layers,
  Zap,
} from "lucide-react";
import { ReasoningTree } from "@/components/brand/ReasoningTree";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RecentSearches } from "@/components/search/RecentSearches";
import { SearchBar } from "@/components/search/SearchBar";
import { SOLUTIONS } from "@/lib/catalog";
import { BRAND } from "@/lib/constants";
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
  const { hero } = BRAND;

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
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
        <section className="relative mx-auto max-w-4xl text-center">
          <div className="hero-glow" aria-hidden />
          <p className="kicker mb-6">{hero.eyebrow}</p>
          <h1 className="hero-headline relative text-4xl text-ink sm:text-5xl lg:text-[3.5rem]">
            {hero.headline}
            <br />
            <span className="glow-text">{hero.headlineAccent}</span>
          </h1>
          <p className="hero-subcopy relative mt-5 sm:mt-6">{hero.subcopy}</p>
          <div className="relative mt-8">
            <Link
              href="#console"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#1a2744] via-violet to-[#f0c4c8] px-8 text-sm font-semibold tracking-wide text-white shadow-[0_10px_36px_rgba(109,91,184,0.38)] transition hover:brightness-110 hover:shadow-[0_14px_48px_rgba(109,91,184,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/50"
            >
              {hero.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="hero-stats relative mx-auto mt-12 max-w-2xl">
            {STATS.map((stat) => (
              <div key={stat.label} className="hero-stat">
                <p className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
                  {stat.value}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-4 text-center">
            <p className="section-label">Research paths</p>
            <p className="mt-1 text-sm text-ink-faint">
              Select a path to launch a structured query
            </p>
          </div>
          <ReasoningTree interactive onPick={pickPath} />
        </section>

        <section id="console" className="mt-14 scroll-mt-24">
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
