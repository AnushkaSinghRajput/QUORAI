import { loadCollection, saveCollection } from "@/lib/persist";
import type { StoredUser } from "@/lib/auth/types";

async function users() {
  return loadCollection<StoredUser[]>("users", []);
}

export async function findUserByEmail(email: string) {
  const list = await users();
  return list.find((user) => user.email === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string) {
  const list = await users();
  return list.find((user) => user.id === id) ?? null;
}

export async function createUser(user: StoredUser) {
  const list = await users();
  if (list.some((entry) => entry.email === user.email)) {
    throw new Error("An account with that email already exists.");
  }
  await saveCollection("users", [...list, user]);
  return user;
}

export async function countUsers() {
  return (await users()).length;
}
