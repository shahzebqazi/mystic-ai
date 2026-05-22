#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { parseMinervaIr } from "@minerva/ir";
import { emitMacos } from "./emitters/macos.js";
import { emitIosStub } from "./emitters/ios-stub.js";
import { emitKotlinStub } from "./emitters/kotlin-stub.js";
import { emitWebStub } from "./emitters/web-stub.js";
import { emitServerStub } from "./emitters/server-stub.js";

async function main() {
  const program = new Command();
  program
    .name("minerva-codegen")
    .description("Emit native and platform glue from Minerva IR")
    .requiredOption("--ir <file>", "Path to minerva IR JSON")
    .option("--emit <targets>", "macos | ios | kotlin | web | server | all", "macos")
    .option("--out <dir>", "Output directory (default: generated/<target>)")
    .option("--repo-root <dir>", "Repository root for resolving asset paths", process.cwd());

  program.parse();
  const opts = program.opts();
  const irRaw = JSON.parse(await readFile(path.resolve(opts.ir), "utf8"));
  const ir = parseMinervaIr(irRaw);
  const repoRoot = path.resolve(opts.repoRoot);
  const targets = opts.emit === "all" ? ["macos", "ios", "kotlin", "web", "server"] : opts.emit.split(",").map((s: string) => s.trim());

  for (const t of targets) {
    const defaultOut =
      t === "macos"
        ? path.join(repoRoot, "generated/macos")
        : path.join(repoRoot, `generated/${t}`);
    const outDir = opts.out && targets.length === 1 ? path.resolve(opts.out) : defaultOut;

    switch (t) {
      case "macos":
        await emitMacos(ir, { outDir, repoRoot });
        break;
      case "ios":
        await emitIosStub(ir, { outDir, repoRoot });
        break;
      case "kotlin":
        await emitKotlinStub(ir, { outDir, repoRoot });
        break;
      case "web":
        await emitWebStub(ir, { outDir, repoRoot });
        break;
      case "server":
        await emitServerStub(ir, { outDir, repoRoot });
        break;
      default:
        throw new Error(`Unknown emit target: ${t}`);
    }
  }

  console.error(`codegen: wrote ${targets.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
