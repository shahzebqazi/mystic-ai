import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MinervaIr } from "@minerva/ir";
import type { EmitContext } from "./macos.js";

/** Placeholder emitter: Android WebView + @JavascriptInterface bridge. */
export async function emitKotlinStub(ir: MinervaIr, ctx: EmitContext): Promise<void> {
  const dir = path.join(ctx.outDir, "stub");
  await mkdir(dir, { recursive: true });
  const readme = `# Kotlin / Android emitter (stub)

Expose \`MinervaBridge\` with @JavascriptInterface methods matching:
${ir.bridge.commands.map((c) => `- ${c.jsName}`).join("\n")}

Inject JS shim so \`${ir.bridge.jsGlobal}.invoke(name, payload)\` calls into Android.
`;
  await writeFile(path.join(dir, "README.md"), readme);
  await writeFile(
    path.join(dir, "bridge_contract.json"),
    JSON.stringify({ jsGlobal: ir.bridge.jsGlobal, commands: ir.bridge.commands }, null, 2),
  );
}
