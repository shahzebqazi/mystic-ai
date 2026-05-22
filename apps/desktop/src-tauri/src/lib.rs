use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::net::Shutdown;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, ACCEPT_LANGUAGE, REFERER, USER_AGENT};
use tauri::path::BaseDirectory;
use tauri::Manager;
use tauri::RunEvent;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum LlmBackend {
    Llamacpp,
    #[default]
    Mlx,
}

fn default_llm_context_tokens() -> u32 {
    32_768
}

fn default_searx_builtin() -> bool {
    true
}

/// Published as `127.0.0.1:PORT` → container `8080`. Avoid **8080**: many dev stacks run OpenResty/nginx there.
const DEFAULT_SEARX_HOST_PORT: u16 = 18_080;

fn default_searx_docker_port() -> u16 {
    DEFAULT_SEARX_HOST_PORT
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default)]
    pub llm_backend: LlmBackend,
    /// When true, Minerva runs `searxng/searxng` in Docker bound to `127.0.0.1:searx_docker_port`.
    #[serde(default = "default_searx_builtin")]
    pub searx_builtin: bool,
    #[serde(default = "default_searx_docker_port")]
    pub searx_docker_port: u16,
    /// Used when `searx_builtin` is false (bring-your-own instance).
    pub searx_base_url: String,
    pub llama_binary_path: String,
    pub llama_model_path: String,
    pub llama_host: String,
    pub llama_port: u16,
    #[serde(default = "default_llm_context_tokens")]
    pub llm_context_tokens: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            llm_backend: LlmBackend::Mlx,
            searx_builtin: true,
            searx_docker_port: DEFAULT_SEARX_HOST_PORT,
            searx_base_url: format!("http://127.0.0.1:{DEFAULT_SEARX_HOST_PORT}"),
            llama_binary_path: String::new(),
            llama_model_path: String::new(),
            llama_host: "127.0.0.1".to_string(),
            llama_port: 8081,
            llm_context_tokens: default_llm_context_tokens(),
        }
    }
}

fn home_dir() -> Option<PathBuf> {
    if let Ok(h) = std::env::var("HOME") {
        if !h.is_empty() {
            return Some(PathBuf::from(h));
        }
    }
    if let Ok(h) = std::env::var("USERPROFILE") {
        if !h.is_empty() {
            return Some(PathBuf::from(h));
        }
    }
    None
}

/// Expand `~/…` (and bare `~`) using HOME / USERPROFILE.
fn expand_user_path(input: &str) -> PathBuf {
    let t = input.trim();
    if t == "~" {
        return home_dir().unwrap_or_else(|| PathBuf::from(t));
    }
    if let Some(rest) = t.strip_prefix("~/") {
        if let Some(h) = home_dir() {
            return h.join(rest);
        }
    }
    PathBuf::from(t)
}

fn path_to_preferred_string(path: &Path, home: &Path) -> String {
    if let Ok(stripped) = path.strip_prefix(home) {
        let rest = stripped.to_string_lossy();
        let rest = rest.trim_start_matches(['/', '\\']);
        if rest.is_empty() {
            return "~".to_string();
        }
        format!("~/{}", rest.replace('\\', "/"))
    } else {
        path.to_string_lossy().replace('\\', "/")
    }
}

fn first_gguf_in(dir: &Path) -> Option<PathBuf> {
    let read = std::fs::read_dir(dir).ok()?;
    let mut files: Vec<PathBuf> = read
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|x| x == "gguf"))
        .collect();
    // Prefer filenames containing "nemotron" when multiple GGUFs exist.
    files.sort_by(|a, b| {
        let pa = a
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_lowercase();
        let pb = b
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_lowercase();
        let na = pa.contains("nemotron");
        let nb = pb.contains("nemotron");
        nb.cmp(&na).then_with(|| a.cmp(b))
    });
    files.into_iter().next()
}

fn discover_llama_binary(home: &Path) -> Option<PathBuf> {
    let candidates = [
        home.join(".local/bin/llama-server"),
        home.join(".minerva/bin/llama-server"),
        PathBuf::from("/opt/homebrew/bin/llama-server"),
        PathBuf::from("/usr/local/bin/llama-server"),
    ];
    candidates.into_iter().find(|p| p.is_file())
}

fn discover_mlx_server_binary(home: &Path) -> Option<PathBuf> {
    let candidates = [
        home.join(".minerva/venvs/mlx-openai-server/bin/mlx-openai-server"),
        home.join(".local/bin/mlx-openai-server"),
        home.join(".minerva/bin/mlx-openai-server"),
        PathBuf::from("/opt/homebrew/bin/mlx-openai-server"),
        PathBuf::from("/usr/local/bin/mlx-openai-server"),
    ];
    candidates.into_iter().find(|p| p.is_file())
}

fn discover_llama_model(home: &Path) -> Option<PathBuf> {
    let dir = home.join(".minerva/models");
    if let Some(p) = first_gguf_in(&dir) {
        return Some(p);
    }
    let p = home.join(".minerva/model.gguf");
    if p.is_file() {
        return Some(p);
    }
    let p = home.join("minerva/model.gguf");
    if p.is_file() {
        return Some(p);
    }
    None
}

/// Fill empty LLM paths from env, then disk discovery, then conventional defaults.
fn apply_llama_path_defaults(s: &mut AppSettings) {
    let Some(home) = home_dir() else {
        return;
    };

    match s.llm_backend {
        LlmBackend::Mlx => {
            if s.llama_binary_path.trim().is_empty() {
                if let Ok(v) = std::env::var("MINERVA_MLX_SERVER_BINARY") {
                    let t = v.trim().to_string();
                    if !t.is_empty() {
                        s.llama_binary_path = t;
                    }
                }
                if s.llama_binary_path.trim().is_empty() {
                    if let Ok(v) = std::env::var("MINERVA_LLAMA_BINARY") {
                        let t = v.trim().to_string();
                        if !t.is_empty() {
                            s.llama_binary_path = t;
                        }
                    }
                }
                if s.llama_binary_path.trim().is_empty() {
                    s.llama_binary_path = discover_mlx_server_binary(&home)
                        .map(|p| path_to_preferred_string(&p, &home))
                        .unwrap_or_else(|| {
                            "~/.minerva/venvs/mlx-openai-server/bin/mlx-openai-server".to_string()
                        });
                }
            }
            if s.llama_model_path.trim().is_empty() {
                if let Ok(v) = std::env::var("MINERVA_MLX_MODEL") {
                    let t = v.trim().to_string();
                    if !t.is_empty() {
                        s.llama_model_path = t;
                    }
                }
                if s.llama_model_path.trim().is_empty() {
                    s.llama_model_path =
                        "mlx-community/Qwen2.5-1.5B-Instruct-4bit".to_string();
                }
            }
        }
        LlmBackend::Llamacpp => {
            if s.llama_binary_path.trim().is_empty() {
                if let Ok(v) = std::env::var("MINERVA_LLAMA_BINARY") {
                    let t = v.trim().to_string();
                    if !t.is_empty() {
                        s.llama_binary_path = t;
                    }
                }
                if s.llama_binary_path.trim().is_empty() {
                    s.llama_binary_path = discover_llama_binary(&home)
                        .map(|p| path_to_preferred_string(&p, &home))
                        .unwrap_or_else(|| "~/.local/bin/llama-server".to_string());
                }
            }

            if s.llama_model_path.trim().is_empty() {
                if let Ok(v) = std::env::var("MINERVA_LLAMA_MODEL") {
                    let t = v.trim().to_string();
                    if !t.is_empty() {
                        s.llama_model_path = t;
                    }
                }
                if s.llama_model_path.trim().is_empty() {
                    s.llama_model_path = discover_llama_model(&home)
                        .map(|p| path_to_preferred_string(&p, &home))
                        .unwrap_or_else(|| "~/.minerva/models/model.gguf".to_string());
                }
            }
        }
    }
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("config dir: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("create config dir: {e}"))?;
    Ok(dir.join("settings.json"))
}

fn read_settings_from_disk(app: &tauri::AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        return Ok(AppSettings::default());
    }
    let raw = std::fs::read_to_string(&path).map_err(|e| format!("read settings: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("parse settings: {e}"))
}

/// MLX loads Hub ids or MLX-format dirs; a leftover `.gguf` path from llama.cpp will not work.
fn migrate_mlx_model_off_gguf(s: &mut AppSettings) {
    if s.llm_backend != LlmBackend::Mlx {
        return;
    }
    let t = s.llama_model_path.trim();
    if t.is_empty() {
        return;
    }
    if !t.to_ascii_lowercase().ends_with(".gguf") {
        return;
    }
    s.llama_model_path = "mlx-community/Qwen2.5-1.5B-Instruct-4bit".to_string();
}

/// If settings use MLX but still point at a llama-server binary, prefer the Minerva venv when present.
fn migrate_mlx_binary_from_legacy_llama(s: &mut AppSettings) {
    if s.llm_backend != LlmBackend::Mlx {
        return;
    }
    let t = s.llama_binary_path.trim();
    if t.is_empty() {
        return;
    }
    if !t.to_ascii_lowercase().contains("llama-server") {
        return;
    }
    let Some(home) = home_dir() else {
        return;
    };
    let venv_bin = home.join(".minerva/venvs/mlx-openai-server/bin/mlx-openai-server");
    if venv_bin.is_file() {
        s.llama_binary_path = path_to_preferred_string(&venv_bin, &home);
    }
}

/// Legacy installs only stored `searx_base_url`. If it clearly points at a remote host, prefer custom mode.
fn apply_searx_builtin_heuristic(s: &mut AppSettings) {
    let url = s.searx_base_url.trim().to_ascii_lowercase();
    if url.starts_with("https://") {
        s.searx_builtin = false;
        return;
    }
    if url.starts_with("http://")
        && !url.contains("127.0.0.1")
        && !url.contains("localhost")
    {
        s.searx_builtin = false;
    }
}

fn clamp_searx_port(s: &mut AppSettings) {
    if s.searx_docker_port == 0 {
        s.searx_docker_port = DEFAULT_SEARX_HOST_PORT;
    }
}

/// One-time-style migration: built-in + legacy 8080 collides with common proxies and local OpenResty stacks.
fn migrate_builtin_searx_off_host_port_8080(app: &tauri::AppHandle, s: &mut AppSettings) {
    if !s.searx_builtin || s.searx_docker_port != 8080 {
        return;
    }
    s.searx_docker_port = DEFAULT_SEARX_HOST_PORT;
    s.searx_base_url = format!("http://127.0.0.1:{DEFAULT_SEARX_HOST_PORT}");
    if let Ok(path) = settings_path(app) {
        if let Ok(raw) = serde_json::to_string_pretty(s) {
            if std::fs::write(&path, raw).is_err() {
                eprintln!("[minerva] could not persist searx host port migration to {}", path.display());
            }
        }
    }
    // Old container still publishes the previous host port; force recreate on next ensure.
    if let Ok(bin) = which::which("docker") {
        let _ = Command::new(bin)
            .args(["rm", "-f", SEARX_CONTAINER_NAME])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
    }
}

fn load_settings_merged(app: &tauri::AppHandle) -> Result<AppSettings, String> {
    let mut s = read_settings_from_disk(app)?;
    apply_searx_builtin_heuristic(&mut s);
    migrate_builtin_searx_off_host_port_8080(app, &mut s);
    clamp_searx_port(&mut s);
    migrate_mlx_binary_from_legacy_llama(&mut s);
    migrate_mlx_model_off_gguf(&mut s);
    apply_llama_path_defaults(&mut s);
    Ok(s)
}

#[tauri::command]
fn load_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    load_settings_merged(&app)
}

#[tauri::command]
fn save_settings(app: tauri::AppHandle, mut settings: AppSettings) -> Result<(), String> {
    clamp_searx_port(&mut settings);
    let path = settings_path(&app)?;
    let raw = serde_json::to_string_pretty(&settings).map_err(|e| format!("serialize: {e}"))?;
    std::fs::write(&path, raw).map_err(|e| format!("write settings: {e}"))
}

// --- Embedded SearXNG (Docker sidecar) ---------------------------------------

const SEARX_CONTAINER_NAME: &str = "minerva-searxng";
const SEARX_IMAGE: &str = "searxng/searxng:latest";
/// Shown on SearXNG errors so support can tell stale binaries from current (hint text changed across releases).
const SEARX_STACK_TAG: &str = concat!("searx-loopback-tcp/", env!("CARGO_PKG_VERSION"));

/// reqwest’s default User-Agent is often blocked by OpenResty/nginx WAF rules and some SearXNG setups.
fn searx_http_default_headers() -> HeaderMap {
    let mut h = HeaderMap::new();
    let ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 MinervaDesktop/0.1";
    if let Ok(v) = HeaderValue::from_str(ua) {
        h.insert(USER_AGENT, v);
    }
    if let Ok(v) = HeaderValue::from_str("application/json, text/html;q=0.9, */*;q=0.8") {
        h.insert(ACCEPT, v);
    }
    if let Ok(v) = HeaderValue::from_str("en-US,en;q=0.9") {
        h.insert(ACCEPT_LANGUAGE, v);
    }
    h
}

fn searx_referer_header(base: &str) -> Option<HeaderValue> {
    let b = base.trim_end_matches('/');
    HeaderValue::from_str(&format!("{b}/")).ok()
}

fn searx_async_client_builder(timeout: Duration) -> reqwest::ClientBuilder {
    reqwest::Client::builder()
        .timeout(timeout)
        .default_headers(searx_http_default_headers())
        .no_proxy()
}

fn searx_error_body_preview(body: &str) -> String {
    let t = body.trim_start();
    if t.starts_with('<') {
        "(HTML page, not SearXNG JSON)".into()
    } else {
        body.chars().take(160).collect()
    }
}

#[derive(Debug)]
enum SearxFetchErr {
    Http { code: u16, body: String },
    Transport(String),
}

/// When custom URL mode fails, try the bundled Docker SearX on loopback (unless rate-limited).
fn searx_custom_failure_eligible_for_docker_fallback(err: &SearxFetchErr) -> bool {
    match err {
        SearxFetchErr::Http { code, body } => {
            if *code == 429 {
                return false;
            }
            if *code == 403 || *code == 401 {
                return true;
            }
            if *code == 200 {
                return false;
            }
            if searx_json_body_ok(body) {
                return false;
            }
            *code >= 400
        }
        SearxFetchErr::Transport(_) => true,
    }
}

/// Same host:port as the built-in Docker publish target (avoid useless double-fetch).
fn searx_base_same_as_builtin_loopback(custom_base_trim: &str, docker_port: u16) -> bool {
    let Some((h, p)) = normalize_searx_loopback_base(custom_base_trim) else {
        return false;
    };
    h == "127.0.0.1" && p == docker_port
}

fn normalize_searx_loopback_base(base_trim: &str) -> Option<(String, u16)> {
    let u = reqwest::Url::parse(base_trim).ok()?;
    if u.scheme() != "http" {
        return None;
    }
    let host = u.host_str()?.to_ascii_lowercase();
    let host = match host.as_str() {
        "localhost" | "::1" | "127.0.0.1" => "127.0.0.1".to_string(),
        _ => return None,
    };
    let port = u.port_or_known_default()?;
    Some((host, port))
}

fn format_searx_user_error(base_trim: &str, builtin_style_errors: bool, err: &SearxFetchErr) -> String {
    match err {
        SearxFetchErr::Transport(msg) => msg.clone(),
        SearxFetchErr::Http { code, body } => {
            let loopback_target = parse_loopback_http_target(base_trim);
            let hint = if *code == 429 {
                if builtin_style_errors {
                    "The built-in instance returned rate limiting (unusual). Retry shortly or restart the search engine in Settings."
                } else {
                    "This instance may be rate-limiting JSON requests. Retry shortly or switch to another URL in Settings."
                }
            } else if *code == 403 {
                let b = body.to_ascii_lowercase();
                if b.contains("openresty")
                    || b.contains("<center>nginx</center>")
                    || b.contains("nginx/")
                {
                    if loopback_target.is_some() {
                        "OpenResty/nginx on loopback after a direct TCP request: the process bound to that host:port is not SearXNG (wrong container, wrong port, or another local reverse proxy). Run `docker ps`, `lsof -i :PORT`, change the search host port in Settings, then Restart search engine."
                    } else {
                        "OpenResty/nginx in front of this remote URL (not SearXNG JSON). Try another instance, ask the operator to allow JSON search, or enable built-in Docker search in Settings."
                    }
                } else if builtin_style_errors {
                    "HTTP 403 on built-in search: confirm Docker is publishing Minerva’s SearXNG on the configured host port, then Restart search engine."
                } else {
                    "HTTP 403: this instance or a front proxy may forbid programmatic access. Try another base URL or built-in Docker search."
                }
            } else {
                ""
            };
            format!(
                "SearXNG returned HTTP {}. {}{}\n\n[{}]",
                code,
                searx_error_body_preview(body),
                if hint.is_empty() {
                    String::new()
                } else {
                    format!("\n\n{}", hint)
                },
                SEARX_STACK_TAG
            )
        }
    }
}

async fn searx_fetch_json_response(
    base_trim: &str,
    query: &str,
    cat: Option<&str>,
    client: &reqwest::Client,
    builtin_style_errors: bool,
) -> Result<String, SearxFetchErr> {
    let base_trim = base_trim.trim_end_matches('/');
    let loopback_target = parse_loopback_http_target(base_trim);
    let url = format!("{base_trim}/search");
    let pq = match build_searx_search_path_and_query(query, cat) {
        Ok(p) => p,
        Err(e) => return Err(SearxFetchErr::Transport(e)),
    };

    for attempt in 1u32..=3u32 {
        let (code, body) = if let Some((ref host, port)) = loopback_target {
            match searx_loopback_http_get_async(host, port, &pq).await {
                Ok(t) => t,
                Err(e) => {
                    return Err(SearxFetchErr::Transport(if builtin_style_errors {
                        format!(
                            "Could not reach built-in SearXNG at {base_trim}: {e}. Check Docker, try Restart search engine in Settings, or inspect logs."
                        )
                    } else {
                        format!("SearXNG request failed: {e}")
                    }));
                }
            }
        } else {
            let res = if let Some(c) = cat {
                let mut req = client.get(&url).query(&[
                    ("q", query),
                    ("format", "json"),
                    ("categories", c),
                ]);
                if let Some(r) = searx_referer_header(base_trim) {
                    req = req.header(REFERER, r);
                }
                req.send().await
            } else {
                let mut req = client
                    .get(&url)
                    .query(&[("q", query), ("format", "json")]);
                if let Some(r) = searx_referer_header(base_trim) {
                    req = req.header(REFERER, r);
                }
                req.send().await
            };
            let res = match res {
                Ok(r) => r,
                Err(e) => {
                    return Err(SearxFetchErr::Transport(if builtin_style_errors {
                        format!(
                            "Could not reach built-in SearXNG at {base_trim}: {e}. Check Docker, try Restart search engine in Settings, or inspect logs."
                        )
                    } else {
                        format!("SearXNG request failed: {e}")
                    }));
                }
            };
            let status = res.status();
            let code = status.as_u16();
            let body = res.text().await.unwrap_or_default();
            if code == 200 {
                return Ok(body);
            }
            (code, body)
        };

        if code == 200 {
            return Ok(body);
        }
        if code == 429 && attempt < 3 {
            let wait_ms = 900u64 + 850u64 * u64::from(attempt);
            tokio::time::sleep(Duration::from_millis(wait_ms)).await;
            continue;
        }
        return Err(SearxFetchErr::Http { code, body });
    }

    unreachable!("searx_fetch_json_response always returns inside retry loop")
}

/// Plain `http://127.0.0.1` / `localhost` / `::1` — use raw TCP so proxies cannot intercept.
fn parse_loopback_http_target(base: &str) -> Option<(String, u16)> {
    let u = reqwest::Url::parse(base).ok()?;
    if u.scheme() != "http" {
        return None;
    }
    let host = u.host_str()?.to_string();
    if !host.eq_ignore_ascii_case("localhost") && host != "127.0.0.1" && host != "::1" {
        return None;
    }
    let port = u.port_or_known_default()?;
    Some((host, port))
}

fn build_searx_search_path_and_query(
    query: &str,
    categories: Option<&str>,
) -> Result<String, String> {
    let mut u = reqwest::Url::parse("http://127.0.0.1/search")
        .map_err(|e| format!("internal url: {e}"))?;
    {
        let mut pairs = u.query_pairs_mut();
        pairs.append_pair("q", query);
        pairs.append_pair("format", "json");
        if let Some(c) = categories.map(str::trim).filter(|c| !c.is_empty()) {
            pairs.append_pair("categories", c);
        }
    }
    let q = u.query().ok_or("internal: missing query string")?;
    Ok(format!("{}?{}", u.path(), q))
}

fn searx_loopback_get_preamble(host: &str, port: u16, path_and_query: &str) -> String {
    let ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 MinervaDesktop/0.1";
    let referer = format!("http://{host}:{port}/");
    format!(
        "GET {path_and_query} HTTP/1.1\r\n\
Host: {host}:{port}\r\n\
Connection: close\r\n\
User-Agent: {ua}\r\n\
Accept: application/json, text/html;q=0.9, */*;q=0.8\r\n\
Accept-Language: en-US,en;q=0.9\r\n\
Referer: {referer}\r\n\
\r\n"
    )
}

fn decode_http_chunked_body(data: &[u8]) -> Result<String, String> {
    let mut pos = 0usize;
    let mut out = Vec::new();
    while pos < data.len() {
        let line_end = data[pos..]
            .windows(2)
            .position(|w| w == b"\r\n")
            .map(|i| pos + i)
            .ok_or_else(|| "invalid chunked encoding (no CRLF)".to_string())?;
        let line = std::str::from_utf8(&data[pos..line_end])
            .map_err(|_| "chunk size line utf8".to_string())?;
        pos = line_end + 2;
        let hex_part = line.split(';').next().unwrap_or("").trim();
        let size = usize::from_str_radix(hex_part, 16)
            .map_err(|_| format!("bad chunk size: {hex_part}"))?;
        if size == 0 {
            break;
        }
        if pos + size > data.len() {
            return Err("chunked body truncated".into());
        }
        out.extend_from_slice(&data[pos..pos + size]);
        pos += size;
        if data.get(pos..pos + 2) != Some(b"\r\n") {
            return Err("chunk data not followed by CRLF".into());
        }
        pos += 2;
    }
    Ok(String::from_utf8_lossy(&out).into_owned())
}

fn searx_json_body_ok(body: &str) -> bool {
    let t = body.trim_start().trim_start_matches('\u{feff}').trim_start();
    t.starts_with('{') || t.starts_with('[')
}

/// Chunked body starts at `body_start`; returns exclusive end index into `buf` when `0\r\n\r\n` is complete.
fn http1_chunked_message_end(buf: &[u8], mut i: usize) -> Result<Option<usize>, String> {
    while i < buf.len() {
        let line_end_rel = match buf[i..].windows(2).position(|w| w == b"\r\n") {
            Some(p) => p,
            None => return Ok(None),
        };
        let line_end = i + line_end_rel;
        let line = std::str::from_utf8(&buf[i..line_end])
            .map_err(|_| "chunk size line is not utf-8".to_string())?;
        i = line_end + 2;
        let hex_part = line.split(';').next().unwrap_or("").trim();
        let size = usize::from_str_radix(hex_part, 16)
            .map_err(|_| format!("invalid chunk size: {hex_part}"))?;
        if size == 0 {
            if buf.len() >= i + 2 && &buf[i..i + 2] == b"\r\n" {
                return Ok(Some(i + 2));
            }
            return Ok(None);
        }
        let data_end = i + size;
        if buf.len() < data_end + 2 {
            return Ok(None);
        }
        if &buf[data_end..data_end + 2] != b"\r\n" {
            return Err("chunk data not followed by CRLF".into());
        }
        i = data_end + 2;
    }
    Ok(None)
}

/// Returns exclusive end offset in `buf` when a full response is available, or `None` if more bytes needed.
/// For responses without `Content-Length` and without `chunked`, completes only at EOF (caller passes full buf).
fn http1_message_complete_end(buf: &[u8]) -> Result<Option<usize>, String> {
    let header_sep = match buf.windows(4).position(|w| w == b"\r\n\r\n") {
        Some(p) => p,
        None => return Ok(None),
    };
    let body_start = header_sep + 4;
    let headers_raw = std::str::from_utf8(&buf[..header_sep])
        .map_err(|_| "HTTP headers not utf-8".to_string())?;
    let mut content_length: Option<usize> = None;
    let mut chunked = false;
    for line in headers_raw.split("\r\n").skip(1) {
        let Some((k, v)) = line.split_once(':') else {
            continue;
        };
        match k.trim().to_ascii_lowercase().as_str() {
            "content-length" => {
                if content_length.is_none() {
                    content_length = v.trim().parse().ok();
                }
            }
            "transfer-encoding" => {
                if v.to_ascii_lowercase().contains("chunked") {
                    chunked = true;
                }
            }
            _ => {}
        }
    }
    if chunked {
        return http1_chunked_message_end(buf, body_start);
    }
    if let Some(len) = content_length {
        let end = body_start.saturating_add(len);
        if buf.len() >= end {
            return Ok(Some(end));
        }
        return Ok(None);
    }
    Ok(None)
}

fn read_http1_response_from_stream(stream: &mut std::net::TcpStream) -> Result<(u16, String), String> {
    let _ = stream.shutdown(Shutdown::Write);
    let mut buf = Vec::new();
    let mut chunk = [0u8; 16_384];
    loop {
        let n = match stream.read(&mut chunk) {
            Ok(n) => n,
            Err(e) => return Err(e.to_string()),
        };
        if n == 0 {
            return parse_http1_response_status_and_body(&buf);
        }
        buf.extend_from_slice(&chunk[..n]);
        if buf.len() > 32 * 1024 * 1024 {
            return Err("HTTP response exceeds 32 MiB".into());
        }
        match http1_message_complete_end(&buf) {
            Ok(Some(end)) => return parse_http1_response_status_and_body(&buf[..end]),
            Ok(None) => {}
            Err(e) => return Err(e),
        }
    }
}

fn parse_http1_response_status_and_body(raw: &[u8]) -> Result<(u16, String), String> {
    let header_end = raw
        .windows(4)
        .position(|w| w == b"\r\n\r\n")
        .ok_or_else(|| "invalid HTTP response (no header end)".to_string())?;
    let headers_raw = &raw[..header_end];
    let body_start = header_end + 4;
    let headers_str = std::str::from_utf8(headers_raw)
        .map_err(|_| "HTTP headers not utf-8".to_string())?;
    let mut lines = headers_str.split("\r\n");
    let status_line = lines
        .next()
        .ok_or_else(|| "empty HTTP response".to_string())?;
    let code: u16 = status_line
        .split_whitespace()
        .nth(1)
        .and_then(|p| p.parse().ok())
        .ok_or_else(|| format!("bad status line: {status_line}"))?;
    let mut content_length: Option<usize> = None;
    let mut chunked = false;
    for line in lines {
        let Some((k, v)) = line.split_once(':') else {
            continue;
        };
        match k.trim().to_ascii_lowercase().as_str() {
            "content-length" => content_length = v.trim().parse().ok(),
            "transfer-encoding" => {
                if v.to_ascii_lowercase().contains("chunked") {
                    chunked = true;
                }
            }
            _ => {}
        }
    }
    let body_rest = &raw[body_start..];
    let body = if chunked {
        decode_http_chunked_body(body_rest)?
    } else if let Some(len) = content_length {
        if body_rest.len() >= len {
            String::from_utf8_lossy(&body_rest[..len]).into_owned()
        } else {
            String::from_utf8_lossy(body_rest).into_owned()
        }
    } else {
        String::from_utf8_lossy(body_rest).into_owned()
    };
    Ok((code, body))
}

fn searx_loopback_http_get_sync(host: &str, port: u16, path_and_query: &str) -> Result<(u16, String), String> {
    let req = searx_loopback_get_preamble(host, port, path_and_query);
    let mut stream = std::net::TcpStream::connect((host, port))
        .map_err(|e| format!("TCP {host}:{port}: {e}"))?;
    let _ = stream.set_read_timeout(Some(Duration::from_secs(50)));
    stream
        .write_all(req.as_bytes())
        .map_err(|e| format!("TCP write: {e}"))?;
    read_http1_response_from_stream(&mut stream)
}

async fn searx_loopback_http_get_async(
    host: &str,
    port: u16,
    path_and_query: &str,
) -> Result<(u16, String), String> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpStream;
    let req = searx_loopback_get_preamble(host, port, path_and_query);
    let mut stream = TcpStream::connect((host, port))
        .await
        .map_err(|e| format!("TCP {host}:{port}: {e}"))?;
    stream
        .write_all(req.as_bytes())
        .await
        .map_err(|e| format!("TCP write: {e}"))?;
    let _ = stream.shutdown().await;
    let mut buf = Vec::new();
    let mut chunk = [0u8; 16_384];
    loop {
        let n = stream
            .read(&mut chunk)
            .await
            .map_err(|e| format!("TCP read: {e}"))?;
        if n == 0 {
            return parse_http1_response_status_and_body(&buf);
        }
        buf.extend_from_slice(&chunk[..n]);
        if buf.len() > 32 * 1024 * 1024 {
            return Err("HTTP response exceeds 32 MiB".into());
        }
        match http1_message_complete_end(&buf) {
            Ok(Some(end)) => return parse_http1_response_status_and_body(&buf[..end]),
            Ok(None) => {}
            Err(e) => return Err(e),
        }
    }
}

static SEARX_DOCKER_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn searx_docker_lock() -> &'static Mutex<()> {
    SEARX_DOCKER_LOCK.get_or_init(|| Mutex::new(()))
}

fn docker_bin() -> Result<PathBuf, String> {
    which::which("docker").map_err(|_| {
        "Docker is not installed or not on PATH. Install Docker Desktop (macOS/Windows) or Docker Engine (Linux), start the daemon, then restart Minerva.".to_string()
    })
}

fn docker_exec(args: &[&str]) -> Result<std::process::Output, String> {
    let bin = docker_bin()?;
    Command::new(&bin)
        .args(args)
        .output()
        .map_err(|e| format!("docker: {e}"))
}

fn bundled_settings_template(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    match app.path().resolve("searxng/settings.yml", BaseDirectory::Resource) {
        Ok(p) if p.is_file() => Ok(p),
        _ => {
            let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/searxng/settings.yml");
            if dev.is_file() {
                Ok(dev)
            } else {
                Err("Bundled searxng/settings.yml not found. Rebuild the app.".into())
            }
        }
    }
}

fn searx_settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("app data dir: {e}"))?
        .join("searx");
    std::fs::create_dir_all(&dir).map_err(|e| format!("create searx dir: {e}"))?;
    Ok(dir.join("settings.yml"))
}

fn materialize_searx_settings(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dest = searx_settings_path(app)?;
    if !dest.exists() {
        let src = bundled_settings_template(app)?;
        std::fs::copy(&src, &dest).map_err(|e| format!("install SearXNG settings.yml: {e}"))?;
    }
    Ok(dest)
}

fn searx_container_running() -> Result<bool, String> {
    let out = docker_exec(&["inspect", "-f", "{{.State.Running}}", SEARX_CONTAINER_NAME])?;
    if !out.status.success() {
        return Ok(false);
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim() == "true")
}

fn searx_container_exists() -> Result<bool, String> {
    Ok(docker_exec(&["inspect", SEARX_CONTAINER_NAME])?.status.success())
}

fn wait_searx_http_ready(port: u16, attempts: u32, sleep_ms: u64) -> Result<(), String> {
    let host = "127.0.0.1";
    let pq = build_searx_search_path_and_query("minerva_health", None)?;
    for _ in 0..attempts {
        let ok = searx_loopback_http_get_sync(host, port, &pq)
            .map(|(c, b)| c == 200 && searx_json_body_ok(&b))
            .unwrap_or(false);
        if ok {
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(sleep_ms));
    }
    Err(format!(
        "Timed out waiting for SearXNG at http://{host}:{port} (check Docker logs; first launch may still be pulling {SEARX_IMAGE})."
    ))
}

fn ensure_searx_docker_ready(app: &tauri::AppHandle, settings: &AppSettings) -> Result<(), String> {
    let _hold = searx_docker_lock()
        .lock()
        .map_err(|_| "internal lock poisoned".to_string())?;
    docker_bin()?;
    let settings_file = materialize_searx_settings(app)?;
    let port = settings.searx_docker_port;
    let mount = settings_file
        .to_str()
        .ok_or("SearXNG settings path must be valid UTF-8 for Docker")?;

    if searx_container_running()? {
        if wait_searx_http_ready(port, 8, 200).is_ok() {
            return Ok(());
        }
        let out = docker_exec(&["restart", "-t", "12", SEARX_CONTAINER_NAME])?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("SearXNG container restart failed: {stderr}"));
        }
        return wait_searx_http_ready(port, 100, 400).map_err(|e| {
            format!("SearXNG did not become healthy after restart: {e}")
        });
    }

    if searx_container_exists()? {
        let out = docker_exec(&["start", SEARX_CONTAINER_NAME])?;
        if out.status.success() {
            return wait_searx_http_ready(port, 100, 400).map_err(|e| {
                format!("SearXNG started but API is not reachable: {e}")
            });
        }
        let _ = docker_exec(&["rm", "-f", SEARX_CONTAINER_NAME]);
    }

    let publish = format!("127.0.0.1:{port}:8080");
    let vol = format!("{mount}:/etc/searxng/settings.yml:ro");
    let bin = docker_bin()?;
    let out = Command::new(&bin)
        .arg("run")
        .arg("-d")
        .arg("--name")
        .arg(SEARX_CONTAINER_NAME)
        .arg("-p")
        .arg(&publish)
        .arg("-v")
        .arg(&vol)
        .arg(SEARX_IMAGE)
        .output()
        .map_err(|e| format!("docker run: {e}"))?;

    if !out.status.success() {
        let stderr = String::from_utf8_lossy(&out.stderr);
        if stderr.contains("address already in use") || stderr.contains("port is already allocated") {
            return Err(format!(
                "Port {port} is already in use. Change the search engine port in Settings or free the port. Docker said: {stderr}"
            ));
        }
        return Err(format!(
            "Could not start the SearXNG container. Is Docker running? The first run downloads `{SEARX_IMAGE}` and can take several minutes.\n{stderr}"
        ));
    }

    wait_searx_http_ready(port, 180, 500).map_err(|e| {
        format!("Container started but SearXNG is not answering yet. {e}")
    })
}

fn effective_searx_base(settings: &AppSettings) -> String {
    if settings.searx_builtin {
        format!(
            "http://127.0.0.1:{}",
            settings.searx_docker_port
        )
    } else {
        settings.searx_base_url.trim().trim_end_matches('/').to_string()
    }
}

fn searx_stop_container_best_effort() {
    if let Ok(bin) = which::which("docker") {
        let _ = Command::new(bin)
            .args(["stop", "-t", "8", SEARX_CONTAINER_NAME])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
    }
}

fn try_autostart_searx(app: &tauri::AppHandle) {
    let settings = match load_settings_merged(app) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[minerva] load settings for SearXNG autostart: {e}");
            return;
        }
    };
    if !settings.searx_builtin {
        return;
    }
    if let Err(e) = ensure_searx_docker_ready(app, &settings) {
        eprintln!("[minerva] SearXNG Docker autostart: {e}");
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearxBuiltinStatus {
    pub builtin_enabled: bool,
    pub docker_available: bool,
    pub docker_error: Option<String>,
    pub container_running: bool,
    pub reachable: bool,
    pub port: u16,
    pub effective_base_url: String,
    pub settings_path: String,
    pub logs_hint: String,
}

#[tauri::command]
async fn searx_builtin_status(app: tauri::AppHandle) -> Result<SearxBuiltinStatus, String> {
    let settings = load_settings_merged(&app)?;
    let builtin_enabled = settings.searx_builtin;
    let effective_base_url = effective_searx_base(&settings);
    let settings_path = searx_settings_path(&app)
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default();

    let (docker_available, docker_error) = match docker_bin() {
        Ok(_) => (true, None),
        Err(e) => (false, Some(e)),
    };

    if !builtin_enabled {
        return Ok(SearxBuiltinStatus {
            builtin_enabled,
            docker_available,
            docker_error,
            container_running: false,
            reachable: true,
            port: settings.searx_docker_port,
            effective_base_url,
            settings_path,
            logs_hint: "Custom SearXNG URL: logs and privacy depend on that instance.".into(),
        });
    }

    let container_running = tokio::task::spawn_blocking(|| searx_container_running())
        .await
        .map_err(|e| format!("join: {e}"))??;

    let reachable = probe_searx_url(&effective_base_url).await;

    let logs_hint = format!(
        "Save logs writes `searxng-docker.log` under the app log folder; settings.yml: {settings_path}"
    );

    Ok(SearxBuiltinStatus {
        builtin_enabled,
        docker_available,
        docker_error,
        container_running,
        reachable,
        port: settings.searx_docker_port,
        effective_base_url,
        settings_path,
        logs_hint,
    })
}

async fn probe_searx_url(base: &str) -> bool {
    let base_trim = base.trim_end_matches('/');
    if let Some((ref host, port)) = parse_loopback_http_target(base_trim) {
        let Ok(pq) = build_searx_search_path_and_query("minerva_ping", None) else {
            return false;
        };
        return searx_loopback_http_get_async(host, port, &pq)
            .await
            .map(|(c, b)| c == 200 && searx_json_body_ok(&b))
            .unwrap_or(false);
    }
    let url = format!("{base_trim}/search");
    let client = match searx_async_client_builder(Duration::from_secs(3)).build() {
        Ok(c) => c,
        Err(_) => return false,
    };
    let mut req = client
        .get(&url)
        .query(&[("q", "minerva_ping"), ("format", "json")]);
    if let Some(r) = searx_referer_header(base_trim) {
        req = req.header(REFERER, r);
    }
    req.send()
        .await
        .map(|resp| resp.status().is_success())
        .unwrap_or(false)
}

#[tauri::command]
fn searx_builtin_restart(app: tauri::AppHandle) -> Result<(), String> {
    let settings = load_settings_merged(&app)?;
    if !settings.searx_builtin {
        return Err("Built-in search is disabled (custom URL mode).".into());
    }
    let _hold = searx_docker_lock()
        .lock()
        .map_err(|_| "internal lock poisoned".to_string())?;
    docker_bin()?;
    materialize_searx_settings(&app)?;
    let _ = docker_exec(&["rm", "-f", SEARX_CONTAINER_NAME]);
    drop(_hold);
    ensure_searx_docker_ready(&app, &settings)
}

#[tauri::command]
fn searx_dump_container_logs(app: tauri::AppHandle) -> Result<String, String> {
    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|e| format!("log dir: {e}"))?;
    std::fs::create_dir_all(&log_dir).map_err(|e| format!("mkdir: {e}"))?;
    let dest = log_dir.join("searxng-docker.log");
    let out = docker_exec(&["logs", "--tail", "1200", SEARX_CONTAINER_NAME])?;
    if !out.status.success() {
        return Err(format!(
            "Could not read Docker logs (is the Minerva SearXNG container running?). {}",
            String::from_utf8_lossy(&out.stderr)
        ));
    }
    let mut f = std::fs::File::create(&dest).map_err(|e| e.to_string())?;
    f.write_all(&out.stdout).map_err(|e| e.to_string())?;
    dest.to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "log path is not valid UTF-8".into())
}

#[tauri::command]
async fn searx_search(
    app: tauri::AppHandle,
    query: String,
    categories: Option<String>,
) -> Result<String, String> {
    let settings = load_settings_merged(&app)?;
    let app_for_blocking = app.clone();
    let settings_for_blocking = settings.clone();

    if settings.searx_builtin {
        let app_b = app_for_blocking.clone();
        let s_b = settings_for_blocking.clone();
        tokio::task::spawn_blocking(move || ensure_searx_docker_ready(&app_b, &s_b))
            .await
            .map_err(|e| format!("searx docker: {e}"))??;
    }

    let base = effective_searx_base(&settings);
    if base.is_empty() {
        return Err("SearXNG base URL is empty. Open Settings and set a custom URL, or enable the built-in search engine.".into());
    }
    let base_trim = base.trim_end_matches('/').to_string();

    let client = searx_async_client_builder(Duration::from_secs(45))
        .build()
        .map_err(|e| format!("http client: {e}"))?;
    let cat = categories
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());

    let primary = searx_fetch_json_response(
        &base_trim,
        query.as_str(),
        cat,
        &client,
        settings.searx_builtin,
    )
    .await;

    match primary {
        Ok(body) => Ok(body),
        Err(err) => {
            if settings.searx_builtin
                || !searx_custom_failure_eligible_for_docker_fallback(&err)
                || searx_base_same_as_builtin_loopback(&base_trim, settings.searx_docker_port)
            {
                return Err(format_searx_user_error(
                    &base_trim,
                    settings.searx_builtin,
                    &err,
                ));
            }

            let app_fb = app.clone();
            let settings_fb = settings.clone();
            if let Err(e) = tokio::task::spawn_blocking(move || {
                ensure_searx_docker_ready(&app_fb, &settings_fb)
            })
            .await
            .map_err(|e| format!("searx docker (fallback): {e}"))?
            {
                return Err(format!(
                    "{}\n\n---\nAutomatic built-in Docker SearX fallback could not start:\n{e}",
                    format_searx_user_error(&base_trim, false, &err),
                ));
            }

            let fallback_trim = format!("http://127.0.0.1:{}", settings.searx_docker_port);
            match searx_fetch_json_response(
                &fallback_trim,
                query.as_str(),
                cat,
                &client,
                true,
            )
            .await
            {
                Ok(body) => Ok(body),
                Err(fb_err) => Err(format!(
                    "{}\n\n---\nAutomatic built-in Docker SearX fallback at {} also failed:\n{}",
                    format_searx_user_error(&base_trim, false, &err),
                    fallback_trim,
                    format_searx_user_error(&fallback_trim, true, &fb_err),
                )),
            }
        }
    }
}

static LLAMA_CHILD: OnceLock<Mutex<Option<Child>>> = OnceLock::new();

fn llama_slot() -> &'static Mutex<Option<Child>> {
    LLAMA_CHILD.get_or_init(|| Mutex::new(None))
}

/// Resolve configured path, or a bare executable name via PATH (`path_fallback_name` when empty).
fn resolve_executable(configured: &str, path_fallback_name: &str) -> Result<PathBuf, String> {
    let trimmed = configured.trim();
    if trimmed.is_empty() {
        return which::which(path_fallback_name).map_err(|_| {
            format!(
                "executable path is empty and `{path_fallback_name}` is not on PATH"
            )
        });
    }
    let expanded = expand_user_path(trimmed);
    if expanded.is_file() {
        return Ok(expanded);
    }
    if !trimmed.contains('/') && !trimmed.contains('\\') {
        return which::which(trimmed).map_err(|e| format!("executable not on PATH: {e}"));
    }
    Err(format!("executable not found at {}", expanded.display()))
}

fn mlx_model_cli_argument(model_spec: &str) -> String {
    let t = model_spec.trim();
    if t.is_empty() {
        return String::new();
    }
    let p = expand_user_path(t);
    if p.is_dir() || p.is_file() {
        p.to_string_lossy().into_owned()
    } else {
        t.to_string()
    }
}

fn llama_start_process(
    binary_path: &Path,
    model_path: &Path,
    host: &str,
    port: u16,
) -> Result<(), String> {
    let mut guard = llama_slot()
        .lock()
        .map_err(|_| "internal lock poisoned".to_string())?;
    if guard.is_some() {
        return Err("LLM server already running".into());
    }
    // Piped stdout/stderr without a reader can deadlock the child once buffers fill; discard instead.
    let child = Command::new(binary_path)
        .arg("-m")
        .arg(model_path)
        .arg("--host")
        .arg(host.trim())
        .arg("--port")
        .arg(port.to_string())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("spawn llama-server: {e}"))?;
    *guard = Some(child);
    Ok(())
}

fn mlx_openai_start_process(
    binary_path: &Path,
    model_spec: &str,
    host: &str,
    port: u16,
) -> Result<(), String> {
    let mut guard = llama_slot()
        .lock()
        .map_err(|_| "internal lock poisoned".to_string())?;
    if guard.is_some() {
        return Err("LLM server already running".into());
    }
    let model_arg = mlx_model_cli_argument(model_spec);
    if model_arg.is_empty() {
        return Err("MLX model is empty (set a Hugging Face repo id like mlx-community/… or a local MLX model path)".into());
    }
    // Run with cwd under ~/.minerva so Python/uvicorn logs do not land in src-tauri/ (avoids `tauri dev` rebuild loops).
    let mut cmd = Command::new(binary_path);
    cmd.arg("launch")
        .arg("--model-path")
        .arg(&model_arg)
        .arg("--model-type")
        .arg("lm")
        .arg("--host")
        .arg(host.trim())
        .arg("--port")
        .arg(port.to_string());
    if let Some(h) = home_dir() {
        let run_dir = h.join(".minerva").join("mlx-runtime");
        if std::fs::create_dir_all(&run_dir).is_ok() {
            cmd.current_dir(&run_dir);
        }
    }
    let child = cmd
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("spawn mlx-openai-server: {e}"))?;
    *guard = Some(child);
    Ok(())
}

#[tauri::command]
fn llama_start(
    llm_backend: String,
    binary_path: String,
    model_path: String,
    host: String,
    port: u16,
) -> Result<(), String> {
    let backend = match llm_backend.trim() {
        "mlx" => LlmBackend::Mlx,
        _ => LlmBackend::Llamacpp,
    };
    let path_fallback = match backend {
        LlmBackend::Llamacpp => "llama-server",
        LlmBackend::Mlx => "mlx-openai-server",
    };
    let bin = resolve_executable(&binary_path, path_fallback)?;
    match backend {
        LlmBackend::Llamacpp => {
            if model_path.trim().is_empty() {
                return Err("model path is empty".into());
            }
            let model = expand_user_path(&model_path.trim());
            if !model.is_file() {
                return Err(format!(
                    "GGUF model not found at {} (llama.cpp expects a .gguf file)",
                    model.display()
                ));
            }
            llama_start_process(&bin, &model, host.trim(), port)
        }
        LlmBackend::Mlx => {
            if model_path.trim().is_empty() {
                return Err("MLX model is empty".into());
            }
            mlx_openai_start_process(&bin, &model_path, host.trim(), port)
        }
    }
}

#[tauri::command]
fn llama_stop() -> Result<(), String> {
    let mut guard = llama_slot()
        .lock()
        .map_err(|_| "internal lock poisoned".to_string())?;
    if let Some(mut child) = guard.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    Ok(())
}

#[tauri::command]
fn llama_running() -> Result<bool, String> {
    let mut guard = llama_slot()
        .lock()
        .map_err(|_| "internal lock poisoned".to_string())?;
    if let Some(ref mut child) = *guard {
        match child.try_wait() {
            Ok(Some(_)) => {
                *guard = None;
                Ok(false)
            }
            Ok(None) => Ok(true),
            Err(e) => Err(format!("try_wait: {e}")),
        }
    } else {
        Ok(false)
    }
}

fn try_autostart_llama(app: &tauri::AppHandle) {
    let settings = match load_settings_merged(app) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[minerva] load settings for LLM autostart: {e}");
            return;
        }
    };
    let path_fallback = match settings.llm_backend {
        LlmBackend::Llamacpp => "llama-server",
        LlmBackend::Mlx => "mlx-openai-server",
    };
    let bin = match resolve_executable(&settings.llama_binary_path, path_fallback) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("[minerva] LLM autostart skipped: {e}");
            return;
        }
    };
    match settings.llm_backend {
        LlmBackend::Llamacpp => {
            let model = expand_user_path(&settings.llama_model_path);
            if !model.is_file() {
                eprintln!(
                    "[minerva] LLM autostart skipped: GGUF not found at {}",
                    model.display()
                );
                return;
            }
            if let Err(e) = llama_start_process(
                &bin,
                &model,
                settings.llama_host.trim(),
                settings.llama_port,
            ) {
                eprintln!("[minerva] LLM autostart failed: {e}");
            } else {
                eprintln!(
                    "[minerva] LLM autostart: llama-server {} (model {})",
                    bin.display(),
                    model.display()
                );
            }
        }
        LlmBackend::Mlx => {
            let spec = settings.llama_model_path.trim();
            if spec.is_empty() {
                eprintln!("[minerva] LLM autostart skipped: MLX model id/path is empty");
                return;
            }
            if let Err(e) = mlx_openai_start_process(
                &bin,
                spec,
                settings.llama_host.trim(),
                settings.llama_port,
            ) {
                eprintln!("[minerva] LLM autostart failed: {e}");
            } else {
                eprintln!(
                    "[minerva] LLM autostart: mlx-openai-server {} (model {})",
                    bin.display(),
                    spec
                );
            }
        }
    }
}

#[cfg(test)]
mod searx_http1_tests {
    use super::*;

    #[test]
    fn content_length_message_complete() {
        let raw = b"HTTP/1.1 200 OK\r\nContent-Length: 11\r\n\r\n{\"ok\":true}";
        assert_eq!(http1_message_complete_end(raw).unwrap(), Some(raw.len()));
    }

    #[test]
    fn chunked_message_complete() {
        let body = r#"{"results":[]}"#;
        let mut raw = String::from("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n");
        raw.push_str(&format!("{:x}\r\n{}\r\n0\r\n\r\n", body.len(), body));
        let b = raw.as_bytes();
        assert_eq!(http1_message_complete_end(b).unwrap(), Some(b.len()));
    }

    #[test]
    fn parse_content_length_response() {
        let raw = b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 11\r\n\r\n{\"ok\":true}";
        let (status, body) = parse_http1_response_status_and_body(raw).unwrap();
        assert_eq!(status, 200);
        assert_eq!(body, "{\"ok\":true}");
        assert!(searx_json_body_ok(&body));
    }

    #[test]
    fn chunked_incomplete_returns_none_until_trailer() {
        let partial = b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nhello";
        assert_eq!(http1_message_complete_end(partial).unwrap(), None);
    }
}

#[cfg(test)]
mod searx_fetch_tests {
    use super::*;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpListener;

    #[tokio::test]
    async fn searx_fetch_json_loopback_mock_returns_results() {
        let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind mock SearX");
        let port = listener.local_addr().expect("addr").port();
        let body = r#"{"results":[{"title":"t","url":"http://example.test","content":"c"}]}"#;
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            body.len(),
            body
        );
        let response_bytes = response.into_bytes();

        tokio::spawn(async move {
            let (mut stream, _) = listener.accept().await.expect("accept");
            let mut buf = vec![0u8; 16_384];
            let _ = stream.read(&mut buf).await;
            stream
                .write_all(&response_bytes)
                .await
                .expect("write mock response");
            let _ = stream.shutdown().await;
        });

        let client = searx_async_client_builder(Duration::from_secs(5))
            .build()
            .expect("client");
        let base = format!("http://127.0.0.1:{port}");
        let json = searx_fetch_json_response(&base, "unit test query", None, &client, true)
            .await
            .expect("searx_fetch_json_response");
        assert!(json.contains("results"));
        assert!(json.contains("example.test"));
    }

    #[test]
    fn docker_fallback_eligible_on_403_html() {
        let err = SearxFetchErr::Http {
            code: 403,
            body: "<html><title>403</title></html>".into(),
        };
        assert!(searx_custom_failure_eligible_for_docker_fallback(&err));
    }

    #[test]
    fn docker_fallback_not_on_429() {
        let err = SearxFetchErr::Http {
            code: 429,
            body: "{}".into(),
        };
        assert!(!searx_custom_failure_eligible_for_docker_fallback(&err));
    }

    #[test]
    fn docker_fallback_not_when_json_error_body() {
        let err = SearxFetchErr::Http {
            code: 500,
            body: r#"{"error":"upstream"}"#.into(),
        };
        assert!(!searx_custom_failure_eligible_for_docker_fallback(&err));
    }

    #[test]
    fn docker_fallback_on_502_non_json() {
        let err = SearxFetchErr::Http {
            code: 502,
            body: "<html>bad gateway</html>".into(),
        };
        assert!(searx_custom_failure_eligible_for_docker_fallback(&err));
    }

    #[tokio::test]
    async fn searx_fetch_json_loopback_includes_categories_param() {
        let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind");
        let port = listener.local_addr().expect("addr").port();
        let body = r#"{"results":[]}"#;
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            body.len(),
            body
        );

        tokio::spawn(async move {
            let (mut stream, _) = listener.accept().await.expect("accept");
            let mut buf = vec![0u8; 16_384];
            let n = stream.read(&mut buf).await.expect("read");
            let req = String::from_utf8_lossy(&buf[..n]);
            assert!(
                req.contains("GET /search?"),
                "expected search path in request: {req:?}"
            );
            assert!(
                req.contains("categories=images"),
                "expected categories in query: {req:?}"
            );
            assert!(req.contains("format=json"), "expected format=json: {req:?}");
            stream
                .write_all(response.as_bytes())
                .await
                .expect("write");
            let _ = stream.shutdown().await;
        });

        let client = searx_async_client_builder(Duration::from_secs(5))
            .build()
            .expect("client");
        let base = format!("http://127.0.0.1:{port}");
        let json = searx_fetch_json_response(&base, "q", Some("images"), &client, true)
            .await
            .expect("fetch");
        assert!(json.contains("results"));
    }
}

#[cfg(test)]
mod searx_contract_tests {
    use super::*;

    #[test]
    fn effective_searx_base_builtin_uses_loopback_and_port() {
        let mut s = AppSettings::default();
        s.searx_builtin = true;
        s.searx_docker_port = 28080;
        assert_eq!(effective_searx_base(&s), "http://127.0.0.1:28080");
    }

    #[test]
    fn effective_searx_base_custom_trims_whitespace_and_slashes() {
        let mut s = AppSettings::default();
        s.searx_builtin = false;
        s.searx_base_url = "  https://my.searx.example/base///  ".to_string();
        assert_eq!(
            effective_searx_base(&s),
            "https://my.searx.example/base"
        );
    }

    #[test]
    fn build_search_path_has_format_json_and_encodes_query() {
        let pq = build_searx_search_path_and_query("hello world", None).expect("path");
        assert!(pq.starts_with("/search?"));
        assert!(pq.contains("format=json"));
        assert!(
            pq.contains("hello") && (pq.contains("%20") || pq.contains("hello+world")),
            "expected encoded space in q=: {pq}"
        );
    }

    #[test]
    fn build_search_path_appends_categories_when_non_empty() {
        let pq = build_searx_search_path_and_query("x", Some("images")).expect("path");
        assert!(pq.contains("categories=images"));
    }

    #[test]
    fn parse_loopback_http_target_rejects_https() {
        assert!(parse_loopback_http_target("https://127.0.0.1:18080").is_none());
    }

    #[test]
    fn normalize_loopback_base_maps_localhost_to_canonical() {
        let (h, p) = normalize_searx_loopback_base("http://localhost:18080").expect("parsed");
        assert_eq!(h, "127.0.0.1");
        assert_eq!(p, 18080);
    }

    #[test]
    fn base_same_as_builtin_detects_matching_port() {
        assert!(searx_base_same_as_builtin_loopback("http://127.0.0.1:18080", 18080));
        assert!(searx_base_same_as_builtin_loopback("http://localhost:18080/", 18080));
        assert!(!searx_base_same_as_builtin_loopback("http://127.0.0.1:18081", 18080));
        assert!(!searx_base_same_as_builtin_loopback("https://127.0.0.1:18080", 18080));
    }

    #[test]
    fn searx_json_body_ok_accepts_bom() {
        assert!(searx_json_body_ok("\u{feff}{\"r\":1}"));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let searx_handle = handle.clone();
            std::thread::Builder::new()
                .name("minerva-llama-autostart".into())
                .spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(450));
                    try_autostart_llama(&handle);
                })
                .map_err(|e| format!("spawn autostart thread: {e}"))?;
            std::thread::Builder::new()
                .name("minerva-searx-autostart".into())
                .spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(900));
                    try_autostart_searx(&searx_handle);
                })
                .map_err(|e| format!("spawn searx autostart thread: {e}"))?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_settings,
            save_settings,
            searx_search,
            searx_builtin_status,
            searx_builtin_restart,
            searx_dump_container_logs,
            llama_start,
            llama_stop,
            llama_running,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_handle, event| {
            if let RunEvent::Exit = event {
                searx_stop_container_best_effort();
            }
        });
}
