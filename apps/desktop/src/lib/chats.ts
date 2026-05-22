import type { SearxHit } from "./types";
import type { ResultViewTab, TabHitBundle } from "./search-tabs";

export type WorkMode = "planning" | "searching" | "researching" | "shopping";

export type ChatSnapshot = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  query: string;
  answer: string;
  hits: SearxHit[];
  /** Per-vertical SearXNG results (web = general). */
  tabHits?: TabHitBundle;
  activeResultTab?: ResultViewTab;
  errorMsg: string | null;
  searched: boolean;
  mode: WorkMode;
  model: string;
};

const STORAGE_KEY = "minerva.chats.v1";

export const MODEL_OPTIONS = [
  { value: "default", label: "Server default" },
  { value: "local-gguf", label: "Local GGUF (loaded)" },
  { value: "nemotron", label: "Nemotron-class" },
] as const;

export const WORK_MODES: { id: WorkMode; label: string; hint: string }[] = [
  { id: "searching", label: "Search", hint: "Fast lookup and links (SearXNG + overview)" },
  { id: "researching", label: "Research", hint: "Deeper synthesis across more sources" },
  { id: "planning", label: "Plan", hint: "Break goals into grounded steps" },
  { id: "shopping", label: "Shop", hint: "Compare options; cite product pages" },
];

function coerceWorkMode(m: unknown): WorkMode {
  if (
    m === "planning" ||
    m === "searching" ||
    m === "researching" ||
    m === "shopping"
  ) {
    return m;
  }
  return "searching";
}

export function loadChats(): ChatSnapshot[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSnapshot[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c) => ({
      ...c,
      mode: coerceWorkMode(c.mode),
    }));
  } catch {
    return [];
  }
}

export function saveChats(list: ChatSnapshot[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

export function newChatId(): string {
  return crypto.randomUUID();
}

export function titleFromQuery(q: string): string {
  const t = q.trim().replace(/\s+/g, " ");
  if (!t) return "New chat";
  return t.length > 48 ? `${t.slice(0, 45)}…` : t;
}

/** OpenAI-compatible `model` field for llama.cpp / local servers. */
export function llmApiModelId(selected: string): string {
  if (
    selected === "default" ||
    selected === "local-gguf" ||
    selected === "nemotron"
  ) {
    return "local";
  }
  return selected.trim() || "local";
}
