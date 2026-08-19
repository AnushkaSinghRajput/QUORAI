"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ReasoningTree } from "@/components/brand/ReasoningTree";
import { CapabilityCards } from "@/components/marketing/CapabilityCards";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RecentSearches } from "@/components/search/RecentSearches";
import { SearchBar } from "@/components/search/SearchBar";
import { SOLUTIONS } from "@/lib/catalog";
import { BRAND } from "@/lib/constants";
import { beginResearch } from "@/lib/research/client";
import { useResearchStore } from "@/lib/store/research-store";

const STATS = [
  { value: "8-12", label: "Sources per deep run" },
  { value: "4", label: "Pipeline stages" },
  { value: "100%", label: "Citation-backed" },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

export function HomeView() {
  const router = useRouter();
  const mode = useResearchStore((s) => s.mode);
  const setMode = useResearchStore((s) => s.setMode);
  const { hero } = BRAND;
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { once: true });

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
        <section
          ref={heroRef}
          className="relative mx-auto max-w-3xl text-center"
        >
          <div className="hero-glow" aria-hidden />
          <motion.p
            className="section-label mb-5"
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0, duration: 0.5, ease: easeOut }}
          >
            {hero.eyebrow}
          </motion.p>
          <motion.h1
            className="hero-headline relative text-4xl text-ink sm:text-5xl lg:text-[3.25rem]"
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.08, duration: 0.5, ease: easeOut }}
          >
            {hero.headline}
            <br />
            <span className="glow-text">{hero.headlineAccent}</span>
          </motion.h1>
          <motion.p
            className="hero-subcopy relative mt-5"
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.16, duration: 0.5, ease: easeOut }}
          >
            {hero.subcopy}
          </motion.p>
          <motion.div
            className="relative mt-8"
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.24, duration: 0.5, ease: easeOut }}
          >
            <Link href="#console" className="btn-primary">
              {hero.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.dl
            className="hero-stats relative mx-auto mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="hero-stat"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
                  {stat.value}
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        </section>

        <section className="section-block">
          <div className="section-header">
            <p className="section-label">Research paths</p>
            <p className="section-desc">
              Select a path to launch a structured query
            </p>
          </div>
          <ReasoningTree interactive onPick={pickPath} />
        </section>

        <section id="console" className="section-block scroll-mt-24">
          <div className="section-header sm:text-left">
            <p className="section-label">Research console</p>
            <h2 className="section-title">What would you like to know?</h2>
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

        <CapabilityCards />
      </main>
      <Footer />
    </div>
  );
}
