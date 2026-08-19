import type { ResearchSession } from "@/lib/types";
import type { StoredBrief } from "@/lib/briefs-types";

export function briefToSession(brief: StoredBrief): ResearchSession {
  const createdAt = brief.createdAt;
  return {
    id: brief.id,
    query: brief.query,
    mode: brief.mode,
    stage: brief.stage,
    answer: brief.answer,
    sources: brief.sources,
    followUps: brief.followUps,
    error: brief.error,
    createdAt,
    updatedAt: brief.updatedAt,
    messages: [
      {
        id: `${brief.id}-q`,
        role: "user",
        content: brief.query,
        createdAt,
      },
      ...(brief.answer
        ? [
            {
              id: `${brief.id}-a`,
              role: "assistant" as const,
              content: brief.answer,
              sources: brief.sources,
              createdAt: brief.updatedAt,
            },
          ]
        : []),
    ],
  };
}
