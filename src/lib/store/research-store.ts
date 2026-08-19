"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { SESSIONS_STORAGE_KEY } from "@/lib/constants";
import type {
  Message,
  ResearchMode,
  ResearchSession,
  ResearchStage,
  Source,
  StreamEvent,
} from "@/lib/types";

const MAX_SESSIONS = 20;
let persistWrites = true;

export function pauseSessionPersist() {
  persistWrites = false;
}

export function resumeSessionPersist() {
  persistWrites = true;
}

interface ResearchState {
  mode: ResearchMode;
  activeSessionId: string | null;
  sessions: Record<string, ResearchSession>;
  isStreaming: boolean;
  setMode: (mode: ResearchMode) => void;
  getSession: (id: string) => ResearchSession | undefined;
  startSession: (query: string, mode: ResearchMode) => ResearchSession;
  applyEvent: (sessionId: string, event: StreamEvent) => void;
  appendFollowUp: (sessionId: string, query: string) => void;
  hydrateSession: (session: ResearchSession) => void;
  setStreaming: (value: boolean) => void;
  resetActive: () => void;
}

function now() {
  return new Date().toISOString();
}

function pruneSessions(
  sessions: Record<string, ResearchSession>,
  keepId?: string,
) {
  const entries = Object.values(sessions).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const next: Record<string, ResearchSession> = {};
  for (const session of entries.slice(0, MAX_SESSIONS)) {
    next[session.id] = session;
  }
  if (keepId && sessions[keepId]) {
    next[keepId] = sessions[keepId];
  }
  return next;
}

export const useResearchStore = create<ResearchState>()(
  persist(
    (set, get) => ({
      mode: "quick",
      activeSessionId: null,
      sessions: {},
      isStreaming: false,
      setMode: (mode) => set({ mode }),
      getSession: (id) => get().sessions[id],
      startSession: (query, mode) => {
        const id = nanoid(12);
        const session: ResearchSession = {
          id,
          query,
          mode,
          stage: "searching",
          answer: "",
          sources: [],
          messages: [
            {
              id: nanoid(8),
              role: "user",
              content: query,
              createdAt: now(),
            },
          ],
          followUps: [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({
          activeSessionId: id,
          sessions: pruneSessions(
            { ...state.sessions, [id]: session },
            id,
          ),
        }));
        return session;
      },
      appendFollowUp: (sessionId, query) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          const message: Message = {
            id: nanoid(8),
            role: "user",
            content: query,
            createdAt: now(),
          };
          return {
            isStreaming: true,
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                query,
                stage: "searching",
                answer: "",
                sources: [],
                followUps: [],
                error: undefined,
                messages: [...session.messages, message].slice(-24),
                updatedAt: now(),
              },
            },
          };
        });
      },
      hydrateSession: (session) => {
        set((state) => {
          const current = state.sessions[session.id];
          if (current) return state;
          return {
            activeSessionId: session.id,
            sessions: pruneSessions(
              { ...state.sessions, [session.id]: session },
              session.id,
            ),
          };
        });
      },
      setStreaming: (value) => set({ isStreaming: value }),
      resetActive: () => set({ activeSessionId: null }),
      applyEvent: (sessionId, event) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          let next: ResearchSession = {
            ...session,
            updatedAt: now(),
          };

          switch (event.type) {
            case "stage":
              if (event.stage) next.stage = event.stage as ResearchStage;
              break;
            case "sources":
              next.sources = (event.sources as Source[]) ?? [];
              break;
            case "token":
              next.answer = `${session.answer}${event.token ?? ""}`;
              break;
            case "follow_ups":
              next.followUps = event.followUps ?? [];
              break;
            case "error":
              next.error = event.error;
              next.stage = "error";
              return {
                sessions: { ...state.sessions, [sessionId]: next },
                isStreaming: false,
              };
            case "done": {
              const assistant: Message = {
                id: nanoid(8),
                role: "assistant",
                content: next.answer,
                sources: next.sources,
                createdAt: now(),
              };
              next = {
                ...next,
                stage: "complete",
                messages: [...next.messages, assistant].slice(-24),
              };
              return {
                sessions: pruneSessions(
                  { ...state.sessions, [sessionId]: next },
                  sessionId,
                ),
                isStreaming: false,
              };
            }
            default:
              break;
          }

          return {
            sessions: { ...state.sessions, [sessionId]: next },
          };
        });
      },
    }),
    {
      name: SESSIONS_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) =>
          typeof window === "undefined" ? null : localStorage.getItem(name),
        setItem: (name, value) => {
          if (!persistWrites || typeof window === "undefined") return;
          localStorage.setItem(name, value);
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(name);
        },
      })),
      partialize: (state) => ({
        mode: state.mode,
        sessions: pruneSessions(state.sessions, state.activeSessionId ?? undefined),
        activeSessionId: state.activeSessionId,
      }),
    },
  ),
);
