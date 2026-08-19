"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, LoaderCircle, Paperclip, Upload, X, Zap } from "lucide-react";
import { ModeToggle } from "@/components/search/ModeToggle";
import { Button } from "@/components/ui/Button";
import {
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  defaultQueryForAttachments,
  readAttachment,
  type ResearchAttachment,
} from "@/lib/files";
import type { ResearchMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SearchBar({
  mode,
  onModeChange,
  onSubmit,
  loading = false,
  initialQuery = "",
  autofocus = false,
  compact = false,
}: {
  mode: ResearchMode;
  onModeChange: (mode: ResearchMode) => void;
  onSubmit: (query: string, attachments?: ResearchAttachment[]) => void;
  loading?: boolean;
  initialQuery?: string;
  autofocus?: boolean;
  compact?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [files, setFiles] = useState<ResearchAttachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFiles(list: FileList | File[]) {
    setFileError(null);
    const incoming = Array.from(list);
    const next = [...files];

    for (const file of incoming) {
      if (next.length >= MAX_ATTACHMENTS) {
        setFileError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
        break;
      }
      if (next.some((item) => item.name === file.name)) {
        continue;
      }
      try {
        next.push(await readAttachment(file));
      } catch (error) {
        setFileError(
          error instanceof Error ? error.message : "Could not read that file.",
        );
      }
    }

    setFiles(next.slice(0, MAX_ATTACHMENTS));
    if (fileRef.current) fileRef.current.value = "";
  }

  function submit() {
    const trimmed = query.trim();
    if (loading) return;
    if (!trimmed && files.length === 0) return;
    onSubmit(
      trimmed || defaultQueryForAttachments(files),
      files.length ? files : undefined,
    );
  }

  const canLaunch = !loading && (query.trim().length >= 2 || files.length > 0);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] transition-all duration-300",
        compact ? "p-3" : "p-4 sm:p-5",
        dragging && "ring-2 ring-rose/50",
        focused && "ring-2 ring-cyan/35 shadow-[0_0_48px_rgba(34,211,238,0.12)]",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void addFiles(event.dataTransfer.files);
      }}
    >
      {/* Gradient border effect */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[1.75rem] p-px transition-opacity duration-300",
          focused || dragging ? "opacity-100" : "opacity-60",
        )}
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--violet) 40%, transparent), color-mix(in oklab, var(--cyan) 30%, transparent), color-mix(in oklab, var(--rose) 25%, transparent))",
        }}
      >
        <div className="h-full w-full rounded-[calc(1.75rem-1px)] bg-bg-elevated/95 backdrop-blur-xl" />
      </div>

      <div className="relative">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <ModeToggle value={mode} onChange={onModeChange} />
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-muted/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">
            <Zap className="h-3.5 w-3.5" />
            {mode === "deep" ? "Deep Research" : "Quick Search"}
            <span className="hidden text-ink-faint sm:inline">
              · {mode === "deep" ? "8–12" : "4–6"} sources
            </span>
          </div>
        </div>

        <textarea
          ref={inputRef}
          value={query}
          rows={compact ? 2 : 3}
          autoFocus={autofocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            files.length
              ? "Ask about the attached file, or launch to analyze it."
              : "Ask QUORAI anything — or drop a brief, notes, or CSV."
          }
          aria-label="Research query"
          className="w-full resize-none bg-transparent font-display text-[1.05rem] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none sm:text-xl"
          disabled={loading}
        />

        {files.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs text-ink"
              >
                <Paperclip className="h-3 w-3 shrink-0 text-rose" />
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  className="rounded-full p-0.5 text-ink-faint hover:text-ink"
                  onClick={() =>
                    setFiles((current) =>
                      current.filter((item) => item.name !== file.name),
                    )
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {fileError && (
          <p className="mt-2 text-xs text-danger">{fileError}</p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              accept={ACCEPTED_ATTACHMENT_TYPES.join(",")}
              onChange={(event) => {
                if (event.target.files) void addFiles(event.target.files);
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 text-sm text-ink-soft transition hover:border-accent/30 hover:text-ink disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint sm:inline">
              {dragging ? "Drop to attach" : "Enter to launch · txt md csv"}
            </p>
          </div>
          <Button onClick={submit} disabled={!canLaunch}>
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Running
              </>
            ) : (
              <>
                Launch
                <ArrowUpRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
