import { loadCollection, saveCollection } from "@/lib/persist";
import type { StoredBrief } from "@/lib/briefs-types";
import type {
  ResearchMode,
  StreamEvent,
} from "@/lib/types";

export type { StoredBrief } from "@/lib/briefs-types";

const MAX_BRIEFS = 80;

async function all(): Promise<StoredBrief[]> {
  return loadCollection<StoredBrief[]>("briefs", []);
}

async function write(briefs: StoredBrief[]) {
  const sorted = [...briefs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  await saveCollection("briefs", sorted.slice(0, MAX_BRIEFS));
}

export async function getBrief(id: string) {
  const briefs = await all();
  return briefs.find((item) => item.id === id) ?? null;
}

export async function listBriefs(userId?: string | null) {
  const briefs = await all();
  if (!userId) return briefs.slice(0, 20);
  return briefs.filter((item) => item.userId === userId).slice(0, 40);
}

export async function upsertBrief(input: {
  id: string;
  query: string;
  mode: ResearchMode;
  userId?: string | null;
  attachmentNames?: string[];
}) {
  const briefs = await all();
  const now = new Date().toISOString();
  const existing = briefs.find((item) => item.id === input.id);
  if (existing) {
    existing.query = input.query;
    existing.mode = input.mode;
    existing.stage = "searching";
    existing.answer = "";
    existing.sources = [];
    existing.followUps = [];
    existing.error = undefined;
    existing.updatedAt = now;
    if (input.userId) existing.userId = input.userId;
    if (input.attachmentNames) existing.attachmentNames = input.attachmentNames;
    await write(briefs);
    return existing;
  }

  const created: StoredBrief = {
    id: input.id,
    query: input.query,
    mode: input.mode,
    stage: "searching",
    answer: "",
    sources: [],
    followUps: [],
    userId: input.userId ?? null,
    attachmentNames: input.attachmentNames,
    createdAt: now,
    updatedAt: now,
  };
  await write([created, ...briefs]);
  return created;
}

export async function applyBriefEvent(id: string, event: StreamEvent) {
  const briefs = await all();
  const brief = briefs.find((item) => item.id === id);
  if (!brief) return null;

  brief.updatedAt = new Date().toISOString();

  switch (event.type) {
    case "stage":
      if (event.stage) brief.stage = event.stage;
      break;
    case "sources":
      brief.sources = event.sources ?? [];
      break;
    case "token":
      brief.answer += event.token ?? "";
      break;
    case "follow_ups":
      brief.followUps = event.followUps ?? [];
      break;
    case "error":
      brief.error = event.error;
      brief.stage = "error";
      break;
    case "done":
      brief.stage = "complete";
      break;
    default:
      break;
  }

  if (event.type !== "token") {
    await write(briefs);
  }

  return brief;
}
