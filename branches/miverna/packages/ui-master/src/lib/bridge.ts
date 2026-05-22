/**
 * Bridge to native host (macOS WKWebView). Matches IR `bridge.jsGlobal` + command `op` names.
 */
const JS_GLOBAL = "__minervaNative";

export async function nativeInvoke<T>(op: string, payload?: Record<string, unknown>): Promise<T> {
  const w = window as unknown as {
    webkit?: { messageHandlers?: { minerva?: { postMessage: (m: unknown) => void } } };
    [key: string]: unknown;
  };
  const bridge = w[JS_GLOBAL] as { invoke?: (a: string, b: unknown) => Promise<T> } | undefined;
  if (w.webkit?.messageHandlers?.minerva && bridge?.invoke) {
    return bridge.invoke(op, payload ?? {});
  }
  return mockInvoke<T>(op, payload);
}

async function mockInvoke<T>(op: string, payload?: Record<string, unknown>): Promise<T> {
  if (op === "loadSettings") {
    return JSON.stringify({
      searxBaseUrl: "http://127.0.0.1:18080",
      llamaHost: "127.0.0.1",
      llamaPort: 8081,
      llmContextTokens: 32768,
    }) as T;
  }
  if (op === "saveSettings") return true as T;
  if (op === "searxSearch") {
    const q = (payload?.query as string) || "";
    return JSON.stringify({
      results: [
        {
          title: `Mock result for “${q}”`,
          url: "https://example.com",
          content: "Browser mock — run inside Minerva Mac app for real SearXNG.",
        },
      ],
    }) as T;
  }
  if (op === "searxStatus") {
    return { reachable: false, mock: true } as T;
  }
  if (op === "llmChat") {
    return JSON.stringify({
      choices: [{ message: { content: "Mock LLM: open in Mac shell with a local server on 8081." } }],
    }) as T;
  }
  throw new Error(`mock: unknown op ${op}`);
}

export function hasNativeBridge(): boolean {
  const w = window as unknown as { webkit?: { messageHandlers?: { minerva?: unknown } } };
  return Boolean(w.webkit?.messageHandlers?.minerva);
}
