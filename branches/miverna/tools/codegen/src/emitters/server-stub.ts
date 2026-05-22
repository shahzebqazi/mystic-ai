import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MinervaIr } from "@minerva/ir";
import type { EmitContext } from "./macos.js";

/** Placeholder: future BFF / proxy routes derived from IR (no secrets in IR). */
export async function emitServerStub(ir: MinervaIr, ctx: EmitContext): Promise<void> {
  const dir = path.join(ctx.outDir, "stub");
  await mkdir(dir, { recursive: true });
  const openapi = {
    openapi: "3.0.0",
    info: { title: `${ir.app.displayName} API stub`, version: "0.0.0" },
    paths: {
      "/health": { get: { summary: "liveness" } },
      "/searx/proxy": {
        post: {
          summary: "optional authenticated proxy to SearXNG",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        },
      },
    },
  };
  await writeFile(path.join(dir, "openapi.snippet.yaml"), JSON.stringify(openapi, null, 2));
  await writeFile(
    path.join(dir, "README.md"),
    `# Server emitter (stub)\n\nExpand OpenAPI from IR bridge \`${ir.bridge.messageHandler}\` when adding a BFF.\n`,
  );
}
