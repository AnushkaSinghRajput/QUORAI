"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FollowUpInput({
  onSubmit,
  loading,
  suggestions = [],
}: {
  onSubmit: (query: string) => void;
  loading?: boolean;
  suggestions?: string[];
}) {
  const [value, setValue] = useState("");

  function submit(next?: string) {
    const query = (next ?? value).trim();
    if (!query || loading) return;
    onSubmit(query);
    setValue("");
  }

  return (
    <div className="surface overflow-hidden rounded-[1.5rem]">
      <div className="border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-medium text-ink">Follow-up</h3>
        </div>
        <p className="mt-0.5 text-xs text-ink-faint">
          Keep context. Drill into caveats, comparisons, or next steps.
        </p>
      </div>

      <div className="p-4 sm:p-5">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                disabled={loading}
                onClick={() => submit(item)}
                className="rounded-full border border-line bg-bg-muted/60 px-3 py-1.5 text-left text-xs text-ink-soft transition hover:border-accent/30 hover:bg-accent-soft/30 hover:text-ink disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-end gap-2">
          <textarea
            value={value}
            rows={2}
            disabled={loading}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask a follow-up…"
            className="min-h-[72px] w-full resize-none rounded-2xl border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition focus:border-accent/30 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <Button
            size="md"
            className="shrink-0"
            disabled={loading || value.trim().length < 2}
            onClick={() => submit()}
            aria-label="Send follow-up"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
