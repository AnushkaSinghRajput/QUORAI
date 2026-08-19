import { nanoid } from "nanoid";
import { loadCollection, saveCollection } from "@/lib/persist";

export interface WaitlistEntry {
  email: string;
  createdAt: string;
}

export interface ContactEntry {
  id: string;
  name: string;
  email: string;
  organization?: string;
  message: string;
  createdAt: string;
}

interface LeadStore {
  waitlist: WaitlistEntry[];
  contacts: ContactEntry[];
}

async function load(): Promise<LeadStore> {
  return loadCollection<LeadStore>("leads", { waitlist: [], contacts: [] });
}

export async function addWaitlistEmail(email: string) {
  const store = await load();
  const already = store.waitlist.some((entry) => entry.email === email);
  if (!already) {
    store.waitlist.push({ email, createdAt: new Date().toISOString() });
    await saveCollection("leads", store);
  }
  return { ok: true as const, already };
}

export async function addContact(entry: {
  name: string;
  email: string;
  organization?: string;
  message: string;
}) {
  const store = await load();
  const record: ContactEntry = {
    id: nanoid(10),
    ...entry,
    createdAt: new Date().toISOString(),
  };
  store.contacts.push(record);
  await saveCollection("leads", store);
  return record;
}

export async function listLeads() {
  const store = await load();
  return {
    waitlistCount: store.waitlist.length,
    contactCount: store.contacts.length,
    waitlist: store.waitlist,
    contacts: store.contacts,
  };
}
