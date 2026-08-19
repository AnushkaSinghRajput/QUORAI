"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { HISTORY_STORAGE_KEY } from "@/lib/constants";
import type { HistoryItem, ResearchMode } from "@/lib/types";
import { truncate } from "@/lib/utils";

interface HistoryState {
  items: HistoryItem[];
  add: (item: {
    id: string;
    query: string;
    mode: ResearchMode;
    preview?: string;
  }) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      add: ({ id, query, mode, preview }) =>
        set((state) => {
          const next: HistoryItem = {
            id,
            query,
            mode,
            preview: truncate(preview || query, 100),
            createdAt: new Date().toISOString(),
          };
          const filtered = state.items.filter(
            (item) => item.id !== id && item.query !== query,
          );
          return { items: [next, ...filtered].slice(0, 24) };
        }),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: HISTORY_STORAGE_KEY },
  ),
);
