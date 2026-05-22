import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MinervaIr } from "@minerva/ir";
import type { EmitContext } from "./macos.js";

/** Placeholder emitter: same bridge contract as macOS, UIKit + WKWebView shell TBD. */
export async function emitIosStub(ir: MinervaIr, ctx: EmitContext): Promise<void> {
  const dir = path.join(ctx.outDir, "stub");
  await mkdir(dir, { recursive: true });
  const readme = `# iOS emitter (stub)

Reuses bridge commands: ${ir.bridge.commands.map((c) => c.name).join(", ")}

Implement \`UIViewController\` + \`WKWebView\` + \`${ir.bridge.messageHandler}\` message handler mirroring generated macOS \`BridgeCoordinator\`.
Bundle id target: \`${ir.app.bundleId}\` (iOS may use \`.ios\` suffix in practice).
`;
  await writeFile(path.join(dir, "README.md"), readme);
  await writeFile(
    path.join(dir, "BridgeCommands.json"),
    JSON.stringify(ir.bridge.commands, null, 2),
  );
}
