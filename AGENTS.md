## Learned User Preferences

- When implementing from an attached plan, do not edit the plan file itself.
- Desktop UI favors a monospace / “nerd” direction: **JetBrains Mono Nerd Font** as the primary stack, technical **SVG** iconography, and sliders for settings instead of a cog; keep **monospace** for chrome and labels; **answer body** may use **Inter Variable** / **`--font-prose`**.
- **Omnibar:** In the search row, the **only** `<button>` is the **Search** submit with a visible **Search** label (not icon-only controls in that row). The query field is an `<input>`; no attach/image/mic or similar buttons there. Placeholder can follow `mockup/search-glass.html` (e.g. example query text) when it does not conflict with these rules.
- Prefer **flat** layouts (lists, dividers, hierarchy) over stacks of rounded **card** chrome; avoid **pill** primary/secondary CTAs where practical; any unavoidable button- or tile-like control should stay **square-first** (corners roughly **≤ 6px**).
- Home hero: use the local LLM for a short search-themed pun when the model is reachable; when it is not, show explicit offline copy instead of a static marketing tagline.
- Settings controls should stay as real buttons for a11y but without visible panel chrome: keep the circular hit area, transparent by default, circular accent highlight on hover.
- For live UI work, run the Vite-backed dev server from `apps/desktop` and keep it running; expect HMR in the Tauri window for frontend edits.

## Learned Workspace Facts

- The product is **Minerva** (Tauri app name/title; bundle id `com.sqazi.minerva`).
- Desktop app lives under `apps/desktop/` (Tauri + SvelteKit + Vite + TypeScript). **Web search:** by default Minerva runs **SearXNG in Docker** on `127.0.0.1` (bundled `settings.yml`, container `minerva-searxng`); optional **custom SearXNG URL** in Settings. Reference Compose stack: `infra/searxng/`. Design note: `docs/embedded-searxng.md`. Glass UI spec: `docs/design/glass-ui.md`; mockup: `mockup/` (align `mockup/search-glass.html` + `mockup/glass.css` when it does not conflict with stricter in-app UI rules).
- **Search failures (“broken search”):** Search only works in the **Tauri** app (`invoke("searx_search")`); a plain browser tab against Vite cannot hit the Rust backend. **Built-in** mode needs **Docker** and the **host port** (default **18080**) serving **SearXNG JSON** at `/search?format=json`. **HTTP 403** with **OpenResty/nginx HTML** usually means **not SearXNG** on that port (wrong process / port clash; 8080 often conflicts) or a **blocked custom instance**. Errors may include **`[searx-loopback-tcp/<crate-version>]`**—if hints look outdated, **rebuild** the desktop binary. **`normalizeSearxResults`** (`apps/desktop/src/lib/searx.ts`) returns **no hits** for HTML or non-SearX JSON even when HTTP “works.”
- **Search fallback & tests:** With **custom SearX URL**, Minerva **retries via built-in Docker** after **401/403**, other **4xx/5xx with non-JSON bodies**, or **transport** errors—not on **429**, not when already built-in, not when custom URL is the same loopback host:port as Docker. Verify with **`cd apps/desktop && npm test`** (Vitest: `src/lib/search-pipeline.test.ts`) and **`cd apps/desktop/src-tauri && cargo test searx_`** (HTTP reader, loopback fetch mock, query/settings contract, fallback rules).
- **Chrome fonts:** self-hosted **JetBrains Mono Nerd Font** TTFs under `apps/desktop/static/fonts/`; `apps/desktop/src/app.css` **`--font`** lists that family first.
- **Font/icon inspection:** dev route **`/dev/fonts`** (`apps/desktop/src/routes/dev/fonts/`); in production it 404s unless **`PUBLIC_SHOW_FONT_INSPECTOR=true`**.
- **Tauri bridge:** do not assume `invoke` in a plain browser tab; guard and return a clear user-facing message (pattern: `apps/desktop/src/lib/tauri-invoke.ts` with **`isTauriRuntime`** / **`invokeSafe`**).
- Local inference is wired to llama.cpp’s OpenAI-compatible HTTP API (`/v1/chat/completions`); hero pun and chat streaming use `apps/desktop/src/lib/llm.ts`.
- Default Vite dev URL is `http://localhost:1420/`; `ERR_CONNECTION_REFUSED` there usually means no dev process is listening (server stopped or never started).
- Visual direction: Cursor-style glass as inspiration, not an official or pixel-perfect copy.

## Svelte (MCP, skills, snippets)

- **Official Svelte MCP** (Cursor **Svelte** plugin, when enabled): use it for any Svelte / SvelteKit work—docs lookup, examples, and validation. **Tools:** `list-sections` (discover doc sections and `use_cases`), `get-documentation` (fetch one or more sections; include everything relevant to the task), `svelte-autofixer` (analyze `.svelte` / Svelte module code—iterate until clean), `playground-link` (only after the user **explicitly** wants a link, and **not** for code already written into this repo).
- **Workflow:** start with `list-sections`, then `get-documentation` for matching sections (runes, `{#snippet}` / `{@render}`, Kit routing, etc.). After substantive edits to Svelte sources, run `svelte-autofixer` again before calling the work done.
- **Snippets & markup:** Svelte 5 snippets and related APIs live in the same doc corpus; resolve the right section names via `list-sections` / `get-documentation` rather than guessing. The MCP also exposes **resource** JSON for many topics (e.g. snippet, runes, Kit modules) alongside the tools above.
- **CLI mirror** (shell / no MCP): `npx @sveltejs/mcp list-sections`, `npx @sveltejs/mcp get-documentation "<a>,<b>"`, `npx @sveltejs/mcp svelte-autofixer "<path_or_code>"`—same capabilities as the server-backed tools.
- **Cursor skills** (load when editing or reviewing Svelte): **`svelte-code-writer`** (MCP CLI usage and analysis for `.svelte` / `.svelte.ts` / `.svelte.js`), **`svelte-core-bestpractices`** (reactivity, events, styling, library integration). For delegated work, the **`svelte-file-editor`** subagent is appropriate for `.svelte` and Svelte modules.
