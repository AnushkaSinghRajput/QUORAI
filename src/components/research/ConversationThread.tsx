import type { Message } from "@/lib/types";
import { stripMarkdown } from "@/lib/markdown";
import { formatRelativeTime, truncate } from "@/lib/utils";

export function ConversationThread({ messages }: { messages: Message[] }) {
  if (messages.length <= 1) return null;

  return (
    <div className="surface rounded-[1.5rem] p-4">
      <h3 className="mb-3 text-sm font-medium text-ink">Conversation</h3>
      <ol className="space-y-3">
        {messages.map((message) => (
          <li
            key={message.id}
            className="rounded-2xl bg-bg-muted/50 px-3 py-2.5"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {message.role === "user" ? "You" : "QUORAI"}
              </span>
              <span className="text-[11px] text-ink-faint">
                {formatRelativeTime(message.createdAt)}
              </span>
            </div>
            <p className="text-sm text-ink-soft">
              {message.role === "assistant"
                ? truncate(stripMarkdown(message.content), 160)
                : message.content}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
