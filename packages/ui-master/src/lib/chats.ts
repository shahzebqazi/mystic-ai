import type { ChatSnap } from "./types";

const KEY = "minerva.master.chats.v1";

export function loadChats(): ChatSnap[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as ChatSnap[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function saveChats(list: ChatSnap[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function newId(): string {
  return crypto.randomUUID();
}
