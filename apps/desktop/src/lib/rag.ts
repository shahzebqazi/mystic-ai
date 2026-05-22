import type { WorkMode } from "./chats";
import type { SearxHit } from "./types";
import type { TabHitBundle } from "./search-tabs";

/**
 * Overview tab: user question + every SearXNG hit we got (grouped). The LLM decides what is relevant.
 * Search / vertical tabs still show raw SearXNG lists only.
 */
export const SYSTEM_PROMPT = `You are Minerva, a local research and search copilot. You help with search, research, planning, shopping, and how-tos.

You receive the user’s question plus **all** SearXNG hits returned for that query, grouped by category (general, news, shopping, etc.). **Not every link will be relevant**—some will be off-topic, duplicate angles, or low-quality.

Rules:
- **Relevance first:** Mentally filter the set. Use only sources that **materially support** answering the user’s request. Do not cite a source for a claim it does not back.
- **Citations:** When you use a source, cite it as [n] immediately after the claim. Skip numbers you did not rely on.
- If the useful subset is small or empty, say so honestly; never invent URLs, prices, dates, or quotes.
- If sources conflict, note it briefly and cite each side.
- Prefer a short direct answer, then bullets for steps, options, or tradeoffs when helpful.
- You may add **one short sentence** if many returned links were clearly irrelevant to the question (optional; keep neutral).
- Do not say “snippets” or “search results”; write as a clear assistant.`;

const MODE_PREFIX: Record<WorkMode, string> = {
  searching:
    "Mode: search — Answer directly; cite only relevant [n] from the bundle below.",
  researching:
    "Mode: research — Synthesize across **relevant** sources; note gaps and disagreements; cite what you use.",
  planning:
    "Mode: plan — Propose a compact numbered plan (3–7 steps) grounded in **relevant** sources only, then expand with citations.",
  shopping:
    "Mode: shopping — Compare using **relevant** product/listing sources; note price/stock uncertainty; ignore unrelated hits.",
};

/** Order we feed verticals to the model (dedupe by URL across sections). */
const VERTICAL_ORDER: { key: keyof TabHitBundle; heading: string }[] = [
  { key: "web", heading: "General" },
  { key: "news", heading: "News" },
  { key: "shopping", heading: "Shopping" },
  { key: "videos", heading: "Videos" },
  { key: "maps", heading: "Maps" },
  { key: "images", heading: "Images" },
];

const MAX_PER_VERTICAL = 20;
const MAX_TOTAL = 52;

function formatHitLine(n: number, h: SearxHit): string {
  const snippet = (h.content ?? "").replace(/\s+/g, " ").trim();
  const body = snippet || "(no snippet)";
  return `[${n}] ${h.title}\nURL: ${h.url}\n${body}`;
}

/**
 * Flatten every returned vertical into one numbered context for the LLM.
 * Same order as [1]…[n] so citations stay stable.
 */
export function buildSearchContextForLlm(bundle: TabHitBundle): {
  hits: SearxHit[];
  block: string;
} {
  const seen = new Set<string>();
  const hits: SearxHit[] = [];
  const sections: string[] = [];

  for (const { key, heading } of VERTICAL_ORDER) {
    const raw = bundle[key];
    if (!raw?.length) continue;

    const lines: string[] = [];
    let sectionAdded = 0;
    for (const h of raw) {
      if (hits.length >= MAX_TOTAL) break;
      if (sectionAdded >= MAX_PER_VERTICAL) break;
      if (seen.has(h.url)) continue;
      seen.add(h.url);
      hits.push(h);
      sectionAdded++;
      lines.push(formatHitLine(hits.length, h));
    }
    if (lines.length > 0) {
      sections.push(`### ${heading}\n${lines.join("\n\n")}`);
    }
  }

  return {
    hits,
    block: sections.join("\n\n"),
  };
}

export function buildUserMessage(
  query: string,
  mode: WorkMode,
  searchContextBlock: string,
): string {
  const ctx = searchContextBlock.trim()
    ? searchContextBlock
    : "(No search results were returned for this query.)";
  const modeLine = MODE_PREFIX[mode];
  return `${modeLine}

User request (answer this directly):
${query}

Returned SearXNG hits (evaluate which URLs/snippets are relevant before you cite):
${ctx}`;
}
