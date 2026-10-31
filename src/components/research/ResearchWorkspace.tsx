"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Clock, FileText, Scale } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AnswerPanel } from "@/components/research/AnswerPanel";
import { CitationLedger } from "@/components/research/CitationLedger";
import { analyzeCitations } from "@/lib/citations";
import { ConversationThread } from "@/components/research/ConversationThread";
import { FollowUpInput } from "@/components/research/FollowUpInput";
import { ProgressIndicator } from "@/components/research/ProgressIndicator";
import { SourceList } from "@/components/research/SourceList";
import { SearchBar } from "@/components/search/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnswerSkeleton } from "@/components/ui/Skeleton";
import { MODE_META } from "@/lib/constants";
import { beginResearch, continueResearch } from "@/lib/research/client";
import { briefToSession } from "@/lib/session-map";
import { useResearchStore } from "@/lib/store/research-store";
import type { ResearchSession } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export function ResearchWorkspace({
  sessionId,
  initialSession = null,
}: {
  sessionId: string;
  initialSession?: ResearchSession | null;
}) {
  const router = useRouter();
  const session = useResearchStore((s) => s.sessions[sessionId]);
  const hydrateSession = useResearchStore((s) => s.hydrateSession);
  const isStreaming = useResearchStore((s) => s.isStreaming);
  const mode = useResearchStore((s) => s.mode);
  const setMode = useResearchStore((s) => s.setMode);
  const [missing, setMissing] = useState(false);
  const [activeSource, setActiveSource] = useState<number | null>(null);
  const guidedToCitations = useRef(false);

  const answer = session?.answer ?? "";
  const sources = useMemo(() => session?.sources ?? [], [session?.sources]);
  const analysis = useMemo(
    () => analyzeCitations(answer, sources),
    [answer, sources],
  );
  const documents = useMemo(() => {
    const pages = new Map<string, Set<number>>();
    for (const source of sources) {
      if (source.kind !== "document" || !source.documentName) continue;
      const set = pages.get(source.documentName) ?? new Set<number>();
      if (source.page) set.add(source.page);
      pages.set(source.documentName, set);
    }
    return Array.from(pages, ([name, set]) => ({
      name,
      pages: Array.from(set).sort((a, b) => a - b),
    }));
  }, [sources]);

  const focusSource = useCallback((index: number) => {
    setActiveSource(index);
    if (typeof window !== "undefined") {
      const next = `#source-${index + 1}`;
      if (window.location.hash !== next) {
        window.history.replaceState(null, "", `${window.location.pathname}${next}`);
      }
    }
    document
      .getElementById(`source-${index + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    function applyHash() {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      if (hash === "citations" || hash === "brief") {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const match = /^source-(\d+)$/.exec(hash);
      if (!match) return;
      const index = Number(match[1]) - 1;
      if (Number.isFinite(index) && index >= 0) {
        setActiveSource(index);
        document
          .getElementById(`source-${index + 1}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [session?.id, session?.stage, sources.length]);

  useEffect(() => {
    guidedToCitations.current = false;
  }, [sessionId]);

  useEffect(() => {
    if (!session || session.stage !== "complete" || guidedToCitations.current) return;
    if (documents.length === 0 || analysis.citedClaims === 0) return;
    if (typeof window === "undefined") return;
    if (window.location.hash && window.location.hash !== "#brief") return;
    guidedToCitations.current = true;
    const timer = window.setTimeout(() => {
      window.history.replaceState(null, "", `${window.location.pathname}#citations`);
      document
        .getElementById("citations")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [analysis.citedClaims, documents.length, session]);

  useEffect(() => {
    if (session) return;
    if (initialSession) {
      hydrateSession(initialSession);
      return;
    }

    let cancelled = false;
    void fetch(`/api/briefs/${sessionId}`)
      .then(async (response) => {
        if (!response.ok) {
          if (!cancelled) setMissing(true);
          return;
        }
        const data = (await response.json()) as {
          brief?: import("@/lib/briefs-types").StoredBrief;
        };
        if (!data.brief || cancelled) return;
        hydrateSession(briefToSession(data.brief));
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrateSession, initialSession, session, sessionId]);

  if (!session && !missing) {
    return (
      <div className="min-h-screen">
        <Header compact />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <AnswerSkeleton />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen">
        <Header compact />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState
            title="Thread not found"
            description="This research run isn't in history. Launch a new query from the QUORAI console."
            actionLabel="Back to console"
            onAction={() => router.push("/")}
          />
        </div>
      </div>
    );
  }

  const loading =
    isStreaming ||
    ["searching", "reading", "analyzing", "synthesizing"].includes(
      session.stage,
    );

  return (
    <div className="min-h-screen">
      <Header compact />
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-muted/40 px-3 py-1.5 text-sm text-ink-soft transition hover:border-accent/25 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/40"
          >
            <ArrowLeft className="h-4 w-4" />
            New query
          </Link>
          <div className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">
              {MODE_META[session.mode].label}
            </span>
            {session.demoMode ? (
              <span className="rounded-full bg-danger-soft px-2 py-0.5 text-danger">
                Demo mode
              </span>
            ) : session.liveReady ? (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-success">
                Live · {session.searchProvider ?? "search"}/{session.llmProvider ?? "llm"}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(session.updatedAt)}
            </span>
            <Link href={`/reliability?session=${session.id}`} className="text-accent">
              Reliability
            </Link>
          </div>
        </div>
        <div className="mb-6 max-w-3xl">
          <p className="section-label">Active brief</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-ink sm:text-4xl">
            {(session.messages[0]?.content || session.query).split("\nAttached:")[0]}
          </h1>
          {documents.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Grounded in
              </span>
              {documents.map((doc) => (
                <span
                  key={doc.name}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-rose/30 bg-rose/10 px-2.5 py-1 text-xs text-ink"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-rose" />
                  <span className="truncate">{doc.name}</span>
                  {doc.pages.length > 0 && (
                    <span className="shrink-0 font-mono text-[10px] text-ink-faint">
                      p. {doc.pages.join(", ")}
                    </span>
                  )}
                </span>
              ))}
              {session.stage === "complete" && analysis.citedClaims > 0 && (
                <a
                  href="#citations"
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-warm-soft px-2.5 py-1 text-xs font-medium text-cyan transition hover:brightness-110"
                >
                  <Scale className="h-3.5 w-3.5" />
                  Review {Math.round(analysis.confidence * 100)}% citation confidence
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <ProgressIndicator stage={session.stage} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.9fr)]">
          <div className="space-y-5">
            <AnswerPanel
              answer={session.answer}
              stage={session.stage}
              error={session.error}
              onRetry={() => {
                const id = beginResearch(session.query, session.mode);
                router.push(`/research/${id}#brief`);
              }}
              sources={sources}
              analysis={analysis}
              activeSource={activeSource}
              onCite={focusSource}
            />
            {session.stage === "complete" && (
              <CitationLedger
                analysis={analysis}
                sources={sources}
                activeSource={activeSource}
                onSelectSource={focusSource}
              />
            )}
            <ConversationThread messages={session.messages} />
            <FollowUpInput
              loading={loading}
              suggestions={session.followUps}
              onSubmit={(query) => continueResearch(session.id, query)}
            />
          </div>
          <div className="space-y-5">
            <SourceList
              sources={sources}
              loading={loading}
              activeSource={activeSource}
              support={analysis.bySource}
              onSelect={setActiveSource}
            />
            <div>
              <p className="section-label mb-2">Refine</p>
              <SearchBar
                compact
                mode={mode}
                onModeChange={setMode}
                loading={loading}
                onSubmit={(query, attachments) => {
                  const id = beginResearch(query, mode, attachments);
                  router.push(
                    `/research/${id}${attachments?.length ? "#brief" : ""}`,
                  );
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
