import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("built CLI reads its version from the package manifest", () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "scriptaudit-version-"));
  cpSync(path.join(repo, "dist"), path.join(fixture, "dist"), { recursive: true });
  cpSync(path.join(repo, "node_modules"), path.join(fixture, "node_modules"), { recursive: true });
  writeFileSync(path.join(fixture, "package.json"), JSON.stringify({ type: "module", version: "9.8.7" }));

  const result = spawnSync(process.execPath, [path.join(fixture, "dist", "cli.js"), "--version"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "9.8.7\n");
});

test("packed and installed CLI version matches the packed manifest", () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "scriptaudit-package-version-"));
  const packed = spawnSync("npm", ["pack", "--json", "--pack-destination", fixture], {
    cwd: repo,
    encoding: "utf8"
  });
  assert.equal(packed.status, 0, packed.stderr);
  const tarball = path.join(fixture, JSON.parse(packed.stdout)[0].filename);

  const installed = spawnSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], {
    cwd: fixture,
    encoding: "utf8"
  });
  assert.equal(installed.status, 0, installed.stderr);

  const manifest = JSON.parse(readFileSync(path.join(fixture, "node_modules", "scriptaudit", "package.json"), "utf8"));
  const cli = path.join(fixture, "node_modules", "scriptaudit", "dist", "cli.js");
  const version = spawnSync(process.execPath, [cli, "--version"], { encoding: "utf8" });
  assert.equal(version.status, 0, version.stderr);
  assert.equal(version.stdout.trim(), manifest.version);
});
