import type { ResearchMode } from "@/lib/types";

export const BRAND = {
  name: "QUORAI",
  tagline: "AI-powered web research.",
  description:
    "QUORAI is an AI-powered web research platform that retrieves multiple sources, synthesizes answers with citations, and runs Deep Research across the open web.",
  hero: {
    eyebrow: "AI Research Platform",
    headline: "Evidence-first research",
    headlineAccent: "synthesized from the live web.",
    subcopy:
      "Retrieve sources across the open web, score credibility, and stream a cited brief — built for teams who need answers they can audit and defend.",
    cta: "Open research console",
  },
} as const;

export const MODE_META: Record<
  ResearchMode,
  { label: string; description: string; sources: string }
> = {
  quick: {
    label: "Quick Search",
    description: "Grounded answer, minutes not hours",
    sources: "4–6 sources",
  },
  deep: {
    label: "Deep Research",
    description: "Multi-source pass with synthesis",
    sources: "8–12 sources",
  },
};

export const STAGE_LABELS = {
  idle: "Ready",
  searching: "Retrieving the web",
  reading: "Ingesting sources",
  analyzing: "Scoring evidence",
  synthesizing: "Composing answer",
  complete: "Complete",
  error: "Something went wrong",
} as const;

export const HISTORY_STORAGE_KEY = "quorai.history.v1";
export const THEME_STORAGE_KEY = "quorai.theme.v1";
export const SESSIONS_STORAGE_KEY = "quorai.sessions.v1";
