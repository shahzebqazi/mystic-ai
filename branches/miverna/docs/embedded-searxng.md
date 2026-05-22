# Embedded SearXNG (Docker sidecar)

## Approach

Minerva’s default search path runs the official [`searxng/searxng`](https://hub.docker.com/r/searxng/searxng) image in a Docker container named `minerva-searxng`. The app:

- Publishes the engine only on **127.0.0.1** and a configurable host port (default **18080**, mapped to container port **8080**).
- Mounts a **settings.yml** copied from the app bundle into the per-user app data directory on first run (so you can edit engines, `formats`, etc., without rebuilding the app).
- **Starts** the container shortly after launch (background thread) and **ensures** it is running before each search.
- **Stops** the container on app exit (`docker stop`) so the sidecar does not outlive the desktop session.

### Tradeoffs

| Pros | Cons |
|------|------|
| Same JSON `/search?format=json` API as before (minimal frontend churn). | Requires a working **Docker** install (Desktop on macOS/Windows, Engine on Linux). |
| No Python/venv bundling in the Tauri binary. | First run may **pull** a large image; can be slow on slow networks. |
| Upstream SearXNG updates are a `docker pull` away. | Port conflicts must be resolved by the user (change host port in Settings). |

Power users can still run a **standalone** stack under `infra/searxng/` (Compose + Caddy) or any other SearXNG deployment, then disable “built-in” in Settings and paste that URL.

## Changing engines / privacy

1. Open Minerva **Settings** and note the path to **settings.yml** (under the app’s local data directory).
2. Edit that file while Minerva is **not** writing to it (quit the app or at least restart the container after edits).
3. Use upstream docs: [SearXNG settings](https://docs.searxng.org/admin/settings/settings.html).

The bundled template lives at `apps/desktop/src-tauri/resources/searxng/settings.yml` and enables `html` + `json` formats with `use_default_settings: true`.

## Platform notes

- **macOS**: Primary target; Docker Desktop is the expected runtime.
- **Windows**: Docker Desktop; bind syntax uses the same `-p 127.0.0.1:PORT:8080` form.
- **Linux**: Docker Engine; ensure your user can talk to the daemon (`docker` CLI works). SELinux may require extra volume labels on some distros (not handled automatically).

## Build vs stale errors

SearXNG error lines should end with **`[searx-loopback-tcp/<version>]`** (crate version). If your message still mentions outdated copy (e.g. long HTTP_PROXY / “migrates old 8080” wording from older builds) or **omits that tag**, you are not running the current Minerva binary—do a **clean rebuild** (`npm run tauri dev` / `npm run tauri build`, or `cargo clean` in `src-tauri` if needed).

## Troubleshooting HTTP 403 (OpenResty / nginx HTML)

If the body shows **OpenResty** or **nginx**, that HTML is **not** from SearXNG inside the official image (it does not ship OpenResty). Typical causes:

1. **HTTP_PROXY / HTTPS_PROXY** — for **loopback** URLs (`http://127.0.0.1`, `localhost`, `::1`), Minerva uses **raw TCP HTTP/1.1** (no reqwest stack), so environment proxies cannot redirect that traffic. Remote `https://…` custom URLs still use reqwest with **`.no_proxy()`** disabled for the client config where applicable.
2. **Wrong host port** — many stacks use **8080** for OpenResty/nginx. Minerva’s default publish port is **18080**; older built-in installs on **8080** are **migrated** automatically (settings updated, old `minerva-searxng` container removed so the next start recreates with the new port). Use **Restart search engine** after upgrading.
3. **Custom URL** — the remote front is OpenResty; try another instance or built-in Docker search.

If the sidecar was created **before** `limiter: false` was added to the bundled template, merge that key into your existing **`settings.yml`** under `server:` (or delete the file so Minerva copies a fresh template on next start—this resets local engine tweaks).

## Manual test checklist (macOS)

### Development (`cargo tauri dev` from `apps/desktop`)

1. Docker Desktop running; default listen **127.0.0.1:18080** (or change port in Settings).
2. Launch dev app; open Settings → built-in status shows Docker available and endpoint reachable within a reasonable time (first launch may pull the image).
3. Submit a query from the home hero; web + vertical tabs return results; Overview behaves as before when the LLM is up.
4. Quit the app; confirm `docker ps` no longer lists `minerva-searxng` (stopped).
5. Change host port to an alternate (e.g. 28080), Save, Restart search engine; search still works.
6. Disable “Use built-in SearXNG”, set a known-good custom base URL, Save; search hits that instance.
7. Re-enable built-in, Save; behavior returns to Docker sidecar.

### Packaged app

Repeat steps 2–4 on a release build (`npm run build` + `cargo tauri build`). Confirm **settings.yml** appears under app local data after first run and that **Save container logs** produces `searxng-docker.log` under the app log directory.

## Dev / production commands

From `apps/desktop/`:

- **Dev (Tauri + Vite):** `npm run tauri dev` (or `npm run dev` for web-only; search commands need Tauri).
- **Typecheck:** `npm run check`
- **Rust only:** `cd src-tauri && cargo check`
- **Production bundle:** `npm run tauri build`
