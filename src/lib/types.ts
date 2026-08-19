export type ResearchMode = "quick" | "deep";

export type ResearchStage =
  | "idle"
  | "searching"
  | "reading"
  | "analyzing"
  | "synthesizing"
  | "complete"
  | "error";

export type CredibilityLevel = "high" | "medium" | "low";

export interface Source {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  relevance: number;
  credibility: CredibilityLevel;
  publishedAt?: string;
  favicon?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt: string;
}

export interface ResearchSession {
  id: string;
  query: string;
  mode: ResearchMode;
  stage: ResearchStage;
  answer: string;
  sources: Source[];
  messages: Message[];
  followUps: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  query: string;
  mode: ResearchMode;
  preview: string;
  createdAt: string;
}

export interface StreamEvent {
  type:
    | "stage"
    | "sources"
    | "token"
    | "follow_ups"
    | "error"
    | "done";
  stage?: ResearchStage;
  sources?: Source[];
  token?: string;
  followUps?: string[];
  error?: string;
  sessionId?: string;
}
