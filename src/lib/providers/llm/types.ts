import type { ResearchMode, Source } from "@/lib/types";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmStreamParams {
  messages: LlmMessage[];
  onToken: (token: string) => Promise<void> | void;
}

export interface LlmProvider {
  name: string;
  stream(params: LlmStreamParams): Promise<string>;
  suggestFollowUps(query: string, answer: string): Promise<string[]>;
}

export interface SynthesisContext {
  query: string;
  mode: ResearchMode;
  sources: Source[];
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  attachments?: Array<{ name: string; text: string }>;
}
