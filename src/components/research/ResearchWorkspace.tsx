"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AnswerPanel } from "@/components/research/AnswerPanel";
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
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(session.updatedAt)}
            </span>
          </div>
        </div>

        <div className="mb-6 max-w-3xl">
          <p className="section-label">Active brief</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-ink sm:text-4xl">
            {session.messages[0]?.content || session.query}
          </h1>
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
                router.push(`/research/${id}`);
              }}
            />
            <ConversationThread messages={session.messages} />
            <FollowUpInput
              loading={loading}
              suggestions={session.followUps}
              onSubmit={(query) => continueResearch(session.id, query)}
            />
          </div>
          <div className="space-y-5">
            <SourceList sources={session.sources} loading={loading} />
            <div>
              <p className="section-label mb-2">Refine</p>
              <SearchBar
                compact
                mode={mode}
                onModeChange={setMode}
                loading={loading}
                onSubmit={(query, attachments) => {
                  const id = beginResearch(query, mode, attachments);
                  router.push(`/research/${id}`);
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
