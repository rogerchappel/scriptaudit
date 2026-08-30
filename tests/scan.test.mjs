import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { scanProject } from "../dist/index.js";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = (name) => path.join(repo, "examples", "fixtures", name);

test("scans a clean fixture and recommends checks", async () => {
  const report = await scanProject({ root: fixture("clean") });
  assert.equal(report.summary.dangerous, 0);
  assert.ok(report.recommendedSequence.some((step) => step.command.includes("tsc")));
});

test("scans risky package scripts", async () => {
  const report = await scanProject({ root: fixture("risky") });
  assert.ok(report.summary.dangerous >= 2);
  assert.ok(report.commands.some((command) => command.network));
});

test("scans monorepo package scripts", async () => {
  const report = await scanProject({ root: fixture("monorepo") });
  assert.ok(report.commands.some((command) => command.workspace === "@fixture/app"));
  assert.ok(report.commands.some((command) => command.kind === "npm-workspace"));
});

test("scans only the top-level pnpm packages list", async () => {
  const report = await scanProject({ root: fixture("pnpm-lists") });
  const workspaces = report.commands
    .filter((command) => command.location.file === "pnpm-workspace.yaml")
    .map(({ id, workspace }) => ({ id, workspace }));

  assert.deepEqual(workspaces, [
    { id: "pnpm-workspace.yaml#package-1", workspace: "apps/*" },
    { id: "pnpm-workspace.yaml#package-2", workspace: "packages/*" }
  ]);
  assert.ok(!report.commands.some((command) => command.workspace === "esbuild"));
  assert.ok(!report.commands.some((command) => command.workspace === "ignored/*"));
});

test("scans nested markdown docs", async () => {
  const report = await scanProject({ root: fixture("docs-only") });
  assert.ok(report.commands.some((command) => command.location.file === "docs/runbook.md"));
});

test("scans risk-relevant commands in shell documentation", async () => {
  const report = await scanProject({ root: fixture("docs-only") });
  const commands = new Map(report.commands.map((command) => [command.command, command]));

  assert.equal(commands.get("curl https://example.com/status")?.network, true);
  assert.ok(commands.get("curl https://example.com/status")?.evidence.some(({ code }) => code === "network-tool"));
  assert.equal(commands.get("docker compose up")?.risk, "caution");
  assert.deepEqual(commands.get("docker compose up")?.sideEffects, ["container"]);
  assert.equal(commands.get("sudo chmod 600 .env")?.risk, "dangerous");
  assert.ok(commands.get("sudo chmod 600 .env")?.evidence.some(({ code }) => code === "permissions"));
  assert.equal(commands.get("npm test")?.risk, "safe");
});

test("joins shell continuations and recognizes environment assignments", async () => {
  const report = await scanProject({ root: fixture("docs-only") });
  const commands = new Map(report.commands.map((command) => [command.command, command]));

  assert.equal(commands.get("rm -rf ./generated")?.risk, "dangerous");
  assert.equal(commands.get("rm -rf ./generated")?.location.line, 24);
  assert.equal(commands.get("CI=1 npm test")?.risk, "safe");
  assert.equal(commands.get("CI=1 npm test")?.location.line, 26);
  assert.equal(commands.has("rm \\"), false);
});

test("scans only executable Taskfile commands", async () => {
  const report = await scanProject({ root: fixture("taskfile-metadata") });
  const taskCommands = report.commands.filter((command) => command.kind === "taskfile");
  assert.deepEqual(taskCommands.map(({ name, command }) => ({ name, command })), [
    { name: "deploy", command: "npm publish" },
    { name: "verify", command: "npm test && npm run check" }
  ]);
  assert.ok(!report.commands.some((command) => command.command.includes("src/**/*.ts")));
  assert.ok(!report.commands.some((command) => command.command.includes("dev")));
  assert.deepEqual(report.recommendedSequence.map((step) => step.command), [
    "npm test && npm run check"
  ]);
});

test("scans tilde-fenced shell commands", async () => {
  const report = await scanProject({ root: fixture("docs-only") });
  const command = report.commands.find(
    (candidate) => candidate.kind === "markdown" && candidate.command === "npm publish"
  );

  assert.equal(command?.location.file, "docs/runbook.md");
  assert.equal(command?.location.line, 9);
  assert.equal(command?.risk, "dangerous");
  assert.ok(!report.commands.some((candidate) => candidate.command.includes("--tag ignored")));
});

test("scans mapping-form Taskfile commands", async () => {
  const report = await scanProject({ root: fixture("docs-only") });
  const command = report.commands.find((candidate) => candidate.kind === "taskfile");

  assert.equal(command?.command, "npm publish");
  assert.equal(command?.location.file, "Taskfile.yml");
  assert.equal(command?.location.line, 4);
  assert.deepEqual(command?.tools, ["npm"]);
  assert.equal(command?.risk, "dangerous");
});

test("scans same-line Makefile recipes with and without prerequisites", async () => {
  const report = await scanProject({ root: fixture("docs-only") });
  const makeCommands = new Map(
    report.commands
      .filter((candidate) => candidate.kind === "makefile")
      .map((candidate) => [candidate.name, candidate])
  );

  assert.equal(makeCommands.get("publish-inline")?.command, "npm publish");
  assert.equal(makeCommands.get("publish-inline")?.location.file, "Makefile");
  assert.equal(makeCommands.get("publish-inline")?.location.line, 7);
  assert.equal(makeCommands.get("publish-inline")?.risk, "dangerous");
  assert.equal(makeCommands.get("verify-inline")?.command, "npm test");
  assert.equal(makeCommands.get("verify-inline")?.location.line, 9);
  assert.equal(makeCommands.get("validate")?.command, "npm run check");
});

test("scans multi-target Make rules and parameterized Just recipes", async () => {
  const report = await scanProject({ root: fixture("docs-only") });
  const commands = new Map(report.commands.map((command) => [`${command.kind}:${command.name}`, command]));

  for (const name of ["build", "test"]) {
    const command = commands.get(`makefile:${name}`);
    assert.equal(command?.command, "npm test");
    assert.equal(command?.location.file, "Makefile");
    assert.equal(command?.location.line, 11);
    assert.equal(command?.risk, "safe");
  }
  assert.equal(commands.has("makefile:export"), false);

  const deploy = commands.get("justfile:deploy");
  assert.equal(deploy?.command, 'rm -rf "build/{{environment}}"');
  assert.equal(deploy?.location.file, "justfile");
  assert.equal(deploy?.location.line, 3);
  assert.equal(deploy?.risk, "dangerous");
  assert.equal(commands.get("justfile:verify")?.command, 'npm test -- "{{suite}}"');
  assert.equal(commands.get("justfile:verify")?.risk, "safe");
  assert.equal(commands.has("justfile:set"), false);
});
