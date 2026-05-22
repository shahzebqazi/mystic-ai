# perplexity-killer

Local, privacy-friendly **search + grounded summary**: [SearXNG](https://docs.searxng.org/) behind a small reverse proxy, plus a **Tauri** desktop UI that calls your self-hosted metasearch and (optionally) a local **llama.cpp** server (e.g. Nemotron-class GGUF).

## Phase 0 (design)

- Design guide: [docs/design/glass-ui.md](docs/design/glass-ui.md)
- Static HTML mockup: open [mockup/search-glass.html](mockup/search-glass.html) in a browser

## Run SearXNG (Docker)

From the repo root:

```bash
cd infra/searxng
docker compose up -d
# or: docker-compose up -d
```

JSON search (via Caddy on localhost only):

```bash
curl -sG 'http://127.0.0.1:8080/search' --data-urlencode 'q=searxng' --data-urlencode 'format=json' | head -c 400
```

If the container layout or settings path differs for your image tag, adjust `docker-compose.yml` and `settings.yml` per [SearXNG docs](https://docs.searxng.org/).

## Run the desktop app

```bash
cd apps/desktop
npm install
npm run tauri dev
```

1. Open **Settings** (gear).
2. Set **SearXNG base URL** (default `http://127.0.0.1:8080`).
3. Optionally set **llama-server** binary path, **GGUF** path, host, and port; click **Start LLM** (or run `llama-server` yourself).

The app uses Rust + `reqwest` for SearXNG (no browser CORS issues). Answers stream from the OpenAI-compatible endpoint on llama.cpp when the process is running.

## llama.cpp

Use a build that provides **`llama-server`** with your model, for example:

```bash
llama-server -m ./model.Q4_K_M.gguf --host 127.0.0.1 --port 8081
```

Match **host** and **port** in app settings.

## Project layout

| Path | Purpose |
|------|---------|
| `apps/desktop/` | Tauri 2 + SvelteKit + TypeScript UI |
| `infra/searxng/` | Docker Compose: Caddy + SearXNG |
| `mockup/` | Static glass UI mockup |
| `docs/design/` | UI design guide |
