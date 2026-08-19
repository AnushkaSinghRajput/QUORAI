"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { WaitlistForm } from "@/components/marketing/LeadForms";
import { cn } from "@/lib/utils";

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  helpful: number;
}

export function FaqList() {
  const [items, setItems] = useState<FaqRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void fetch("/api/faq")
      .then((response) => response.json())
      .then((data: { items?: FaqRow[] }) => {
        setItems(data.items ?? []);
        setOpen(data.items?.[0]?.id ?? null);
      })
      .catch(() => setItems([]));
  }, []);

  const shown = items.filter((item) => {
    const hay = `${item.question} ${item.answer}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  async function markHelpful(id: string) {
    const response = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) return;
    const data = (await response.json()) as { helpful?: number };
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, helpful: data.helpful ?? item.helpful + 1 } : item,
      ),
    );
  }

  return (
    <div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search questions"
        className="h-12 w-full rounded-2xl border border-line bg-black/30 px-4 text-sm text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-violet/40"
      />
      <div className="mt-6 space-y-2">
        {shown.map((item) => {
          const expanded = open === item.id;
          return (
            <article key={item.id} className="surface rounded-[1.3rem]">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(expanded ? null : item.id)}
                aria-expanded={expanded}
              >
                <span className="font-display text-lg text-ink">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-ink-faint transition",
                    expanded && "rotate-180",
                  )}
                />
              </button>
              {expanded && (
                <div className="border-t border-white/10 px-5 py-4">
                  <p className="text-sm leading-relaxed text-ink-soft">{item.answer}</p>
                  <button
                    type="button"
                    onClick={() => void markHelpful(item.id)}
                    className="mt-4 text-xs text-ink-faint hover:text-[#f0c4c8]"
                  >
                    Helpful · {item.helpful}
                  </button>
                </div>
              )}
            </article>
          );
        })}
        {shown.length === 0 && (
          <p className="py-8 text-sm text-ink-soft">No matches. Ask the desk below.</p>
        )}
      </div>
      <div className="surface mt-10 rounded-[1.5rem] p-6">
        <h2 className="font-display text-2xl">Still stuck?</h2>
        <p className="mt-2 text-sm text-ink-soft">Join the waitlist and we will follow up.</p>
        <div className="mt-5">
          <WaitlistForm />
        </div>
      </div>
    </div>
  );
}
