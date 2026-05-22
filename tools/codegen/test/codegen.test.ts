import { readFile, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { parseMinervaIr, safeParseMinervaIr } from "@minerva/ir";
import { emitMacos } from "../src/emitters/macos.ts";
import { emitIosStub } from "../src/emitters/ios-stub.ts";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const defaultIrPath = path.join(repoRoot, "packages/minerva-ir/fixtures/default.ir.json");

describe("IR", () => {
  it("parses default fixture", async () => {
    const raw = JSON.parse(await readFile(defaultIrPath, "utf8"));
    const r = safeParseMinervaIr(raw);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.app.bundleId).toBe("com.sqazi.minerva");
      expect(r.data.bridge.commands.length).toBeGreaterThan(0);
    }
  });
});

describe("emitters", () => {
  it("emits stable macOS Package.swift header", async () => {
    const raw = JSON.parse(await readFile(defaultIrPath, "utf8"));
    const ir = parseMinervaIr(raw);
    const dir = await mkdtemp(path.join(tmpdir(), "minerva-codegen-"));
    try {
      await emitMacos(ir, { outDir: dir, repoRoot });
      const pkg = await readFile(path.join(dir, "Package.swift"), "utf8");
      expect(pkg).toContain("// swift-tools-version: 5.9");
      expect(pkg).toContain('name: "MinervaHost"');
      expect(pkg).toContain(".macOS(.v13)");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("emits iOS stub README", async () => {
    const raw = JSON.parse(await readFile(defaultIrPath, "utf8"));
    const ir = parseMinervaIr(raw);
    const dir = await mkdtemp(path.join(tmpdir(), "minerva-ios-"));
    try {
      await emitIosStub(ir, { outDir: dir, repoRoot });
      const rd = await readFile(path.join(dir, "stub/README.md"), "utf8");
      expect(rd).toContain("WKWebView");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
