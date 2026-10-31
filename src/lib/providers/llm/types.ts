import type { ResearchMode, Source } from "@/lib/types";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmUsage {
  model?: string;
  stopReason?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface LlmStreamParams {
  messages: LlmMessage[];
  onToken: (token: string) => Promise<void> | void;
}

export interface LlmCompletion extends LlmUsage {
  text: string;
}

export interface LlmFollowUps extends LlmUsage {
  followUps: string[];
}

export interface LlmProvider {
  name: string;
  stream(params: LlmStreamParams): Promise<LlmCompletion>;
  suggestFollowUps(query: string, answer: string): Promise<LlmFollowUps>;
}

export interface SynthesisContext {
  query: string;
  mode: ResearchMode;
  sources: Source[];
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  attachments?: Array<{ name: string; text: string }>;
}
