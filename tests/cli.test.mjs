import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
