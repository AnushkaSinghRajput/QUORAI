import { accessSync, constants } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface PersistCache {
  __quoraiPersist?: Record<string, unknown>;
}

const cache = globalThis as typeof globalThis & PersistCache;

function bucket() {
  if (!cache.__quoraiPersist) cache.__quoraiPersist = {};
  return cache.__quoraiPersist;
}

function filePath(name: string) {
  return path.join(process.cwd(), "data", `${name}.json`);
}

export async function loadCollection<T>(name: string, fallback: T): Promise<T> {
  const memory = bucket()[name] as T | undefined;
  if (memory !== undefined) return memory;

  try {
    const raw = await readFile(filePath(name), "utf8");
    const parsed = JSON.parse(raw) as T;
    bucket()[name] = parsed;
    return parsed;
  } catch {
    bucket()[name] = fallback;
    return fallback;
  }
}

export async function saveCollection<T>(name: string, value: T): Promise<"disk" | "memory"> {
  bucket()[name] = value;
  try {
    await mkdir(path.dirname(filePath(name)), { recursive: true });
    await writeFile(filePath(name), JSON.stringify(value, null, 2), "utf8");
    return "disk";
  } catch {
    return "memory";
  }
}

export function persistenceMode(): "disk" | "memory" {
  try {
    accessSync(process.cwd(), constants.W_OK);
    return "disk";
  } catch {
    return "memory";
  }
}
