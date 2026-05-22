import { invoke } from "@tauri-apps/api/core";

/** True when the page is hosted inside a Tauri webview (not a standalone browser tab). */
export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export type InvokeResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const BROWSER_MESSAGE =
  "This view is not running inside the Minerva desktop app. Open Minerva from a Tauri build to search via SearXNG and sync settings with the host.";

export async function invokeSafe<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<InvokeResult<T>> {
  if (!isTauriRuntime()) {
    return { ok: false, message: BROWSER_MESSAGE };
  }
  try {
    const data =
      args === undefined
        ? await invoke<T>(cmd)
        : await invoke<T>(cmd, args as never);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}
