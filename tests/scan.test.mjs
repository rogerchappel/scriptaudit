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
