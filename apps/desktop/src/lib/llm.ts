export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Usage reported in streaming or final JSON chunks (OpenAI-compatible). */
export type StreamUsageReport = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

/** Browser must not use `0.0.0.0` as fetch host; map bind-all to loopback. */
export function llmClientBaseUrl(host: string, port: number): string {
  const h = host.trim();
  const loopback =
    h === "0.0.0.0" || h === "::" || h === "[::]" ? "127.0.0.1" : h;
  return `http://${loopback}:${port}`;
}

/** True if an OpenAI-compatible server answers (process may have re-exec’d, e.g. mlx-openai-server). */
export async function probeLlmReachable(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const root = baseUrl.replace(/\/$/, "");
  try {
    const r = await fetch(`${root}/v1/models`, { method: "GET", signal });
    if (r.ok) return true;
  } catch {
    /* try fallback */
  }
  try {
    const r = await fetch(`${root}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model: "local",
        stream: false,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Shown on the home screen when the local LLM is unreachable. */
export const HERO_AI_OFFLINE =
  "$ inference: offline — no local OpenAI-compatible server on your configured host (llama.cpp or mlx-openai-server). Open Settings, then start the LLM or search with SearXNG only. Hosted models via API key are not in this build yet.";

/**
 * Ask the local model for a single-line searching-themed pun (non-streaming).
 */
export async function fetchSearchingPun(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model: "local",
      stream: false,
      max_tokens: 96,
      temperature: 0.92,
      messages: [
        {
          role: "system",
          content:
            "You write exactly one short pun about web search, queries, indexes, crawling, or research. Max 22 words. No emojis. No quotation marks around the line. No preamble.",
        },
        { role: "user", content: "pun" },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;
  const line = sanitizePunLine(raw);
  return line ?? null;
}

function sanitizePunLine(s: string): string | null {
  let t = s.replace(/\r\n/g, "\n").split("\n")[0]?.trim() ?? "";
  t = t.replace(/^["'“”]+|["'“”]+$/g, "");
  t = t.replace(/^(pun|here|ok|sure)[:\s.-]+/i, "").trim();
  if (t.length > 220) t = `${t.slice(0, 217)}…`;
  return t.length > 0 ? t : null;
}

/**
 * Stream OpenAI-compatible chat completions from the local server (llama.cpp or MLX).
 */
export async function streamChatCompletion(
  baseUrl: string,
  messages: ChatMessage[],
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
  options?: { model?: string },
): Promise<{ usage: StreamUsageReport | null }> {
  const model = options?.model?.trim() || "local";
  const url = `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
  let usageReport: StreamUsageReport | null = null;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: true,
      messages,
    }),
    signal,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`LLM HTTP ${res.status}: ${t.slice(0, 240)}`);
  }
  if (!res.body) throw new Error("No response body from LLM");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const rawLine = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      const line = rawLine.replace(/\r$/, "").trim();
      if (line === "" || line.startsWith(":")) continue;
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trimStart();
      if (data === "[DONE]") return { usage: usageReport };
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
          };
        };
        if (json.usage) {
          usageReport = {
            promptTokens: json.usage.prompt_tokens,
            completionTokens: json.usage.completion_tokens,
            totalTokens: json.usage.total_tokens,
          };
        }
        const chunk = json.choices?.[0]?.delta?.content;
        if (chunk) onDelta(chunk);
      } catch {
        /* ignore partial JSON */
      }
    }
  }
  return { usage: usageReport };
}
