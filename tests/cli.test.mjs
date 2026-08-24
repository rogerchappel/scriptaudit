import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repo, "dist", "cli.js");

test("CLI writes JSON reports", () => {
  const result = spawnSync(process.execPath, [cli, "scan", "examples/fixtures/clean", "--format", "json"], {
    cwd: repo,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).summary.dangerous, 0);
});

test("CLI supports PRD fail-on high alias", () => {
  const result = spawnSync(process.execPath, [cli, "scan", "examples/fixtures/risky", "--format", "json", "--fail-on", "high"], {
    cwd: repo,
    encoding: "utf8"
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Risk threshold met: high/);
});

test("CLI fail-on detects dangerous parameterized Just recipes", () => {
  const result = spawnSync(process.execPath, [cli, "scan", "examples/fixtures/docs-only", "--format", "json", "--fail-on", "dangerous"], {
    cwd: repo,
    encoding: "utf8"
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Risk threshold met: dangerous/);
  assert.equal(JSON.parse(result.stdout).commands.some(({ kind, name }) => kind === "justfile" && name === "deploy"), true);
});

test("CLI rejects a missing explicitly requested config", () => {
  const result = spawnSync(process.execPath, [cli, "scan", "examples/fixtures/clean", "--config", "missing.config.json"], {
    cwd: repo,
    encoding: "utf8"
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Config file not found: .*missing\.config\.json/);
});

test("CLI rejects a nonexistent scan root without emitting a report", () => {
  const root = path.join(mkdtempSync(path.join(os.tmpdir(), "scriptaudit-missing-")), "does-not-exist");
  const result = spawnSync(process.execPath, [cli, "scan", root, "--format", "json"], {
    cwd: repo,
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, new RegExp(`Scan root does not exist: ${escapeRegExp(root)}`));
});

test("CLI rejects a scan root that is not a directory", () => {
  const root = path.join(mkdtempSync(path.join(os.tmpdir(), "scriptaudit-file-")), "project.txt");
  writeFileSync(root, "not a project directory\n");
  const result = spawnSync(process.execPath, [cli, "scan", root, "--format", "json"], {
    cwd: repo,
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, new RegExp(`Scan root is not a directory: ${escapeRegExp(root)}`));
});

test("CLI accepts an empty directory as a valid scan root", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "scriptaudit-empty-"));
  const result = spawnSync(process.execPath, [cli, "scan", root, "--format", "json"], {
    cwd: repo,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).summary, {
    safe: 0,
    caution: 0,
    dangerous: 0,
    unknown: 0,
    total: 0
  });
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
