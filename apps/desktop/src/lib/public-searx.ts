/** Normalize user-entered SearXNG base URLs (custom / advanced mode). */
export function normalizeSearxBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}
