/** Matches Rust `LlmBackend` (serde `rename_all = "lowercase"`). */
export type LlmBackend = "llamacpp" | "mlx";

export type AppSettings = {
  llmBackend: LlmBackend;
  /** Default: Docker sidecar on 127.0.0.1:searxDockerPort */
  searxBuiltin: boolean;
  searxDockerPort: number;
  /** Used when `searxBuiltin` is false. */
  searxBaseUrl: string;
  llamaBinaryPath: string;
  llamaModelPath: string;
  llamaHost: string;
  llamaPort: number;
  /** Context window size (tokens) for the context meter; tune to your loaded model. */
  llmContextTokens: number;
};

/** Matches Rust `SearxBuiltinStatus` (camelCase). */
export type SearxBuiltinStatus = {
  builtinEnabled: boolean;
  dockerAvailable: boolean;
  dockerError: string | null;
  containerRunning: boolean;
  reachable: boolean;
  port: number;
  effectiveBaseUrl: string;
  settingsPath: string;
  logsHint: string;
};

export type SearxHit = {
  title: string;
  url: string;
  content?: string;
  /** SearXNG `img_src` when present (e.g. image search). */
  thumbnail?: string;
};
