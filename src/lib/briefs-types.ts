import type {
  ResearchMode,
  ResearchStage,
  Source,
} from "@/lib/types";

export interface StoredBrief {
  id: string;
  query: string;
  mode: ResearchMode;
  stage: ResearchStage;
  answer: string;
  sources: Source[];
  followUps: string[];
  error?: string;
  userId?: string | null;
  attachmentNames?: string[];
  createdAt: string;
  updatedAt: string;
}
