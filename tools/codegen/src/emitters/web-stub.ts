import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MinervaIr } from "@minerva/ir";
import type { EmitContext } from "./macos.js";

/** Placeholder: static hosting manifest + mock bridge for CI / Storybook-style previews. */
export async function emitWebStub(ir: MinervaIr, ctx: EmitContext): Promise<void> {
  const dir = path.join(ctx.outDir, "stub");
  await mkdir(dir, { recursive: true });
  const pkg = {
    name: `${ir.app.displayName.toLowerCase().replace(/\s+/g, "-")}-web-stub`,
    private: true,
    note: "Copy packages/ui-master/build here or point CDN; use mock native bridge in browser.",
  };
  await writeFile(path.join(dir, "package.snippet.json"), JSON.stringify(pkg, null, 2));
  await writeFile(path.join(dir, "README.md"), `# Web packaging stub\n\nStatic export lives in master UI package.\n`);
}
