import { cpSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.resolve(root, "../../apps/desktop/static/fonts");
const dest = path.resolve(root, "static/fonts");

if (!existsSync(src)) {
  console.warn("copy-fonts: skip (no legacy fonts at apps/desktop/static/fonts)");
  mkdirSync(dest, { recursive: true });
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("copy-fonts: copied JetBrains Mono Nerd → static/fonts");
