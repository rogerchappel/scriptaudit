import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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

test("CLI rejects non-string package scripts with a path-specific diagnostic", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "scriptaudit-invalid-scripts-"));
  writeFileSync(path.join(root, "package.json"), '{"name":"probe","scripts":{"test":false}}');
  const result = scan(root);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "Invalid package script in package.json at scripts.test: expected a string.\n");
});

test("CLI rejects malformed package JSON with the discovered path", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "scriptaudit-invalid-json-"));
  mkdirSync(path.join(root, "nested"));
  writeFileSync(path.join(root, "nested", "package.json"), '{"scripts":');
  const result = scan(root);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Invalid JSON in .*nested[/\\]package\.json\./);
});

test("CLI rejects malformed Taskfile YAML instead of reporting zero commands", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "scriptaudit-invalid-taskfile-"));
  writeFileSync(path.join(root, "Taskfile.yml"), "tasks:\n  release:\n    cmds: [\n      - npm publish\n");
  const result = scan(root);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "Invalid Taskfile YAML in Taskfile.yml.\n");
});

test("CLI includes deferred Taskfile commands in task risk evidence", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "scriptaudit-taskfile-defer-"));
  writeFileSync(
    path.join(root, "Taskfile.yml"),
    "version: '3'\ntasks:\n  deploy:\n    cmds:\n      - cmd: npm test\n      - defer: rm -rf build\n"
  );
  const result = scan(root);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.commands[0].command, "npm test && rm -rf build");
  assert.equal(report.commands[0].risk, "dangerous");
  assert.equal(report.summary.dangerous, 1);
});

test("CLI rejects malformed Taskfile command entries with a path-specific diagnostic", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "scriptaudit-invalid-task-command-"));
  writeFileSync(
    path.join(root, "Taskfile.yml"),
    "version: '3'\ntasks:\n  deploy:\n    cmds:\n      - cmd: npm test\n      - defer: false\n"
  );
  const result = scan(root);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(
    result.stderr,
    "Invalid Taskfile command in Taskfile.yml at tasks.deploy.cmds[1]: expected a string, cmd string, or defer string.\n"
  );
});

function scan(root) {
  return spawnSync(process.execPath, [cli, "scan", root, "--format", "json"], {
    cwd: repo,
    encoding: "utf8"
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
