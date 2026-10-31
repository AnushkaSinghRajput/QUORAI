import { analyzeCsv, isCsvFile } from "@/lib/csv";
import { contentTokens } from "@/lib/text-match";
import type { ResearchMode, Source } from "@/lib/types";

export const PAGE_MARKER = /^\[\[page:(\d+)\]\]$/;

interface DocumentInput {
  name: string;
  text: string;
}

interface Passage {
  file: string;
  page?: number;
  text: string;
  order: number;
}

const PASSAGE_CHARS = 720;

function splitPages(text: string): Array<{ page?: number; text: string }> {
  const pages: Array<{ page?: number; text: string }> = [];
  let current: { page?: number; lines: string[] } = { lines: [] };

  for (const line of text.split("\n")) {
    const marker = line.trim().match(PAGE_MARKER);
    if (marker) {
      if (current.lines.length) {
        pages.push({ page: current.page, text: current.lines.join("\n") });
      }
      current = { page: Number(marker[1]), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length) {
    pages.push({ page: current.page, text: current.lines.join("\n") });
  }
  return pages.filter((page) => page.text.trim().length > 0);
}

function chunk(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    if (buffer && buffer.length + sentence.length > PASSAGE_CHARS) {
      chunks.push(buffer);
      buffer = "";
    }
    buffer = buffer ? `${buffer} ${sentence}` : sentence;
    while (buffer.length > PASSAGE_CHARS * 1.4) {
      chunks.push(buffer.slice(0, PASSAGE_CHARS));
      buffer = buffer.slice(PASSAGE_CHARS);
    }
  }
  if (buffer.trim().length > 40) chunks.push(buffer);
  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push(text.trim().slice(0, PASSAGE_CHARS));
  }
  return chunks;
}

function passagesFor(files: DocumentInput[]): Passage[] {
  const passages: Passage[] = [];
  for (const file of files) {
    if (isCsvFile(file.name)) {
      const analysis = analyzeCsv(file.name, file.text);
      passages.push({
        file: file.name,
        text: `${analysis.evidenceSnippet}\n${analysis.keyInsights.join("\n")}`,
        order: passages.length,
      });
      if (analysis.sampleRows.length > 0) {
        passages.push({
          file: file.name,
          text: `Sample preview rows from ${file.name}:\n${JSON.stringify(analysis.sampleRows.slice(0, 3), null, 2)}`,
          order: passages.length,
        });
      }
      continue;
    }

    const pages = splitPages(file.text);
    if (pages.length === 0 && file.text.trim().length > 0) {
      for (const text of chunk(file.text)) {
        passages.push({ file: file.name, text, order: passages.length });
      }
    } else {
      for (const page of pages) {
        for (const text of chunk(page.text)) {
          passages.push({ file: file.name, page: page.page, text, order: passages.length });
        }
      }
    }
  }
  return passages;
}

/** BM25-style scores for each passage against the query. */
function scorePassages(passages: Passage[], query: string): number[] {
  const queryTerms = Array.from(new Set(contentTokens(query)));
  if (queryTerms.length === 0 || passages.length === 0) {
    return passages.map(() => 0);
  }

  const docs = passages.map((passage) => contentTokens(passage.text));
  const avgLength = docs.reduce((sum, doc) => sum + doc.length, 0) / docs.length || 1;
  const documentFrequency = new Map<string, number>();
  for (const doc of docs) {
    for (const term of new Set(doc)) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  return docs.map((doc) => {
    const counts = new Map<string, number>();
    for (const term of doc) counts.set(term, (counts.get(term) ?? 0) + 1);
    let score = 0;
    for (const term of queryTerms) {
      const tf = counts.get(term) ?? 0;
      if (!tf) continue;
      const df = documentFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
      score += (idf * tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (doc.length / avgLength)));
    }
    return score;
  });
}

function sourceUrl(file: string, page?: number) {
  return `quorai-doc://${encodeURIComponent(file)}${page ? `#page=${page}` : ""}`;
}

/**
 * Turns uploaded files into ranked, page-addressable evidence so the model
 * cites them with [n] exactly like web sources.
 */
export function buildDocumentEvidence(
  attachments: DocumentInput[] | undefined,
  query: string,
  mode: ResearchMode,
): Source[] {
  if (!attachments?.length) return [];
  const passages = passagesFor(attachments);
  if (passages.length === 0) return [];

  const limit = mode === "deep" ? 6 : 3;
  const scores = scorePassages(passages, query);
  const best = Math.max(...scores);
  const ranked = passages
    .map((passage, index) => ({ passage, score: scores[index] }))
    .sort((a, b) =>
      best > 0 ? b.score - a.score || a.passage.order - b.passage.order : a.passage.order - b.passage.order,
    );

  const picked: typeof ranked = [];
  const perPage = new Map<string, number>();
  for (const file of attachments) {
    const top = ranked.find((item) => item.passage.file === file.name);
    if (top && picked.length < limit) {
      picked.push(top);
      perPage.set(`${top.passage.file}:${top.passage.page}`, 1);
    }
  }
  for (const item of ranked) {
    if (picked.length >= limit) break;
    if (picked.includes(item)) continue;
    const key = `${item.passage.file}:${item.passage.page}`;
    if ((perPage.get(key) ?? 0) >= 2) continue;
    perPage.set(key, (perPage.get(key) ?? 0) + 1);
    picked.push(item);
  }

  return picked.map(({ passage, score }, index) => {
    const relevance = best > 0 ? 0.6 + 0.39 * (score / best) : 0.7 - index * 0.03;
    return {
      id: `doc-${index}-${passage.order}`,
      title: passage.page ? `${passage.file} · page ${passage.page}` : passage.file,
      url: sourceUrl(passage.file, passage.page),
      domain: "Your document",
      snippet: passage.text.trim(),
      relevance: Math.round(Math.min(0.99, relevance) * 100) / 100,
      credibility: "high" as const,
      kind: "document" as const,
      page: passage.page,
      documentName: passage.file,
    };
  });
}

/** Readable text for search-query hints (page markers removed). */
export function documentHint(text: string | undefined, length = 140) {
  if (!text) return undefined;
  return text
    .split("\n")
    .filter((line) => !PAGE_MARKER.test(line.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
}
