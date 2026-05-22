/**
 * End-to-end search needs all of the following (tests below lock in the TS side only):
 *
 * 1. **Tauri runtime** — `searx_search` is a Tauri command. Running the UI in a normal browser
 *    (Vite only) cannot reach the backend; use `npm run tauri dev` or the packaged app.
 *
 * 2. **SearXNG JSON** — The Rust layer must receive HTTP 200 with a JSON body whose top-level
 *    `results` is an array. HTML error pages (OpenResty/nginx) produce zero hits here by design.
 *
 * 3. **Built-in (Docker)** — Docker daemon running; container `minerva-searxng` healthy;
 *    host port (default 18080) must not be taken by another service (common failure: nginx on
 *    the same port → 403 HTML).
 *
 * 4. **Custom URL** — Base URL must allow `GET /search?format=json&...` without a WAF blocking
 *    programmatic access. After certain failures, Minerva retries via built-in Docker when possible.
 */

import { describe, expect, it } from "vitest";
import { normalizeSearxBaseUrl } from "./public-searx";
import { formatDomain, normalizeSearxResults } from "./searx";

describe("normalizeSearxBaseUrl", () => {
  it("trims and strips trailing slashes", () => {
    expect(normalizeSearxBaseUrl("  https://sx.example/search///  ")).toBe(
      "https://sx.example/search",
    );
  });
});

describe("normalizeSearxResults", () => {
  it("parses SearXNG-style JSON and caps topK", () => {
    const json = JSON.stringify({
      results: [
        { title: "A", url: "https://a.test", content: "c1" },
        { title: "B", url: "https://b.test" },
        { title: "", url: "https://a.test" },
      ],
    });
    const hits = normalizeSearxResults(json, 2);
    expect(hits).toHaveLength(2);
    expect(hits[0].url).toBe("https://a.test");
    expect(hits[1].url).toBe("https://b.test");
  });

  it("dedupes by URL", () => {
    const json = JSON.stringify({
      results: [
        { title: "One", url: "https://x.test" },
        { title: "Dup", url: "https://x.test" },
      ],
    });
    expect(normalizeSearxResults(json, 10)).toHaveLength(1);
  });

  it("uses URL as title when title missing", () => {
    const json = JSON.stringify({
      results: [{ url: "https://only.url/path" }],
    });
    const [h] = normalizeSearxResults(json, 5);
    expect(h.title).toBe("https://only.url/path");
  });

  it("returns empty array on invalid JSON (matches broken SearX / HTML body)", () => {
    expect(normalizeSearxResults("<html>no</html>", 5)).toEqual([]);
    expect(normalizeSearxResults("", 5)).toEqual([]);
    expect(normalizeSearxResults("{}", 5)).toEqual([]);
  });

  it("returns empty when results is missing or not an array", () => {
    expect(normalizeSearxResults(JSON.stringify({ foo: [] }), 3)).toEqual([]);
    expect(normalizeSearxResults(JSON.stringify({ results: null }), 3)).toEqual([]);
  });
});

describe("formatDomain", () => {
  it("strips www and returns hostname", () => {
    expect(formatDomain("https://www.example.com/a")).toBe("example.com");
  });

  it("falls back to raw string on bad URL", () => {
    expect(formatDomain("not a url")).toBe("not a url");
  });
});
