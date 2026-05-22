import type { ChatMessage } from "./llm";
import type { ChatSnapshot } from "./chats";
import {
  SYSTEM_PROMPT,
  buildSearchContextForLlm,
  buildUserMessage,
} from "./rag";

/** Rough token estimate (~4 chars per token + small per-message overhead). */
export function estimateMessagesTokens(messages: ChatMessage[]): number {
  let n = 0;
  for (const m of messages) {
    const body = m.content ?? "";
    n += Math.ceil(body.length / 4) + 4;
  }
  return n;
}

/** Reconstruct overview prompt + stored answer for chat restore. */
export function estimateContextFromSnapshot(c: ChatSnapshot): number {
  const bundle =
    c.tabHits && Object.keys(c.tabHits).length > 0
      ? c.tabHits
      : { web: c.hits };
  const { block } = buildSearchContextForLlm(bundle);
  const userContent = buildUserMessage(c.query, c.mode, block);
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];
  let used = estimateMessagesTokens(messages);
  if (c.answer?.trim()) {
    used += Math.ceil(c.answer.length / 4);
  }
  return used;
}

export function formatTokenShort(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(Math.round(n));
}
