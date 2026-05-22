import type { SearxHit } from "./types";

/** SearXNG category tokens (instance-dependent; empty tabs if unsupported). */
export type SearchTabKey = "web" | "images" | "videos" | "news" | "maps" | "shopping";

export type ResultViewTab = "answer" | SearchTabKey;

export type TabHitBundle = Partial<Record<SearchTabKey, SearxHit[]>>;

export const SEARCH_TAB_DEFS: {
  key: SearchTabKey;
  label: string;
  searxCategories: string;
  topK: number;
}[] = [
  { key: "web", label: "Search", searxCategories: "general", topK: 14 },
  { key: "images", label: "Images", searxCategories: "images", topK: 24 },
  { key: "videos", label: "Videos", searxCategories: "videos", topK: 14 },
  { key: "news", label: "News", searxCategories: "news", topK: 14 },
  { key: "maps", label: "Maps", searxCategories: "map", topK: 12 },
  { key: "shopping", label: "Shopping", searxCategories: "shopping", topK: 14 },
];

const TAB_INTENTS: Record<SearchTabKey, RegExp | null> = {
  web: null,
  images:
    /\b(photo|photos|image|images|picture|pictures|wallpaper|wallpapers|gif|png|jpg|jpeg|svg|icon|icons|logo|meme|memes|screenshot)\b/i,
  videos:
    /\b(video|videos|youtube|watch|trailer|trailers|clip|clips|stream|streaming|tiktok|vimeo|netflix)\b/i,
  news: /\b(news|breaking|headline|headlines|journalist|reuters|bbc|cnn|press)\b/i,
  maps: /\b(map|maps|near me|nearby|directions|route|routes|distance|gps|latitude|longitude)\b/i,
  shopping:
    /\b(buy|buying|price|prices|cheap|deal|deals|shop|shopping|store|amazon|ebay|coupon|retail|cart|checkout)\b/i,
};

export function tabRelevantToQuery(tab: SearchTabKey, query: string): boolean {
  if (tab === "web") return true;
  const re = TAB_INTENTS[tab];
  return re ? re.test(query) : false;
}

/** Show a category tab if it has hits or the query plausibly needs that vertical. */
export function tabShouldDisplay(
  tab: SearchTabKey,
  query: string,
  count: number,
): boolean {
  if (tab === "web") return true;
  if (count > 0) return true;
  return tabRelevantToQuery(tab, query);
}

export type VisibleTab = { id: ResultViewTab; label: string; count: number };

export function buildVisibleTabs(
  query: string,
  tabHits: TabHitBundle,
): VisibleTab[] {
  const q = query.trim();
  const out: VisibleTab[] = [{ id: "answer", label: "Overview", count: 0 }];
  for (const d of SEARCH_TAB_DEFS) {
    const n = tabHits[d.key]?.length ?? 0;
    if (!tabShouldDisplay(d.key, q, n)) continue;
    out.push({ id: d.key, label: d.label, count: n });
  }
  return out;
}

export function emptyTabBundle(): TabHitBundle {
  return {};
}
