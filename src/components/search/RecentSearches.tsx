"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Clock3, History, Trash2, X } from "lucide-react";
import { useHistoryStore } from "@/lib/store/history-store";
import { MODE_META } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

function useHasHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function RecentSearches() {
  const items = useHistoryStore((s) => s.items);
  const clear = useHistoryStore((s) => s.clear);
  const remove = useHistoryStore((s) => s.remove);
  const hydrated = useHasHydrated();

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-bg-elevated/50 px-6 py-14 text-center text-sm text-ink-faint">
        Loading recent searches…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No recent research yet"
        description="Your searches will appear here so you can jump back into a thread instantly."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <History className="h-4 w-4 text-accent" />
          Recent searches
        </h2>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-ink-faint transition hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 8).map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2 rounded-2xl border border-line bg-bg-elevated/60 px-3 py-2.5 transition hover:border-accent/25 hover:bg-bg-elevated/80"
          >
            <Link href={`/research/${item.id}`} className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink group-hover:text-accent-strong">
                {item.query}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-faint">
                <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">
                  {MODE_META[item.mode].label}
                </span>
                <Clock3 className="h-3 w-3" />
                <span>{formatRelativeTime(item.createdAt)}</span>
              </div>
            </Link>
            <button
              type="button"
              aria-label="Remove from history"
              onClick={() => remove(item.id)}
              className="rounded-lg p-1.5 text-ink-faint opacity-0 transition hover:bg-bg-muted hover:text-ink group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
