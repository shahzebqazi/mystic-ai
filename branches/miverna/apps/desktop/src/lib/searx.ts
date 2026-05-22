import type { SearxHit } from "./types";

type RawResult = {
  title?: string;
  url?: string;
  content?: string;
  img_src?: string;
};

/**
 * Parse SearXNG JSON and return up to `topK` unique URLs.
 */
export function normalizeSearxResults(jsonText: string, topK: number): SearxHit[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object") return [];
  const results = (parsed as { results?: RawResult[] }).results;
  if (!Array.isArray(results)) return [];

  const seen = new Set<string>();
  const out: SearxHit[] = [];
  for (const r of results) {
    const url = typeof r.url === "string" ? r.url.trim() : "";
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const title = typeof r.title === "string" && r.title.trim() ? r.title.trim() : url;
    const content = typeof r.content === "string" ? r.content : undefined;
    const thumbnail =
      typeof r.img_src === "string" && r.img_src.trim() ? r.img_src.trim() : undefined;
    out.push({ title, url, content, thumbnail });
    if (out.length >= topK) break;
  }
  return out;
}

export function formatDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
