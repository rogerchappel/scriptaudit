import assert from "node:assert/strict";
import test from "node:test";
import { renderReport } from "../dist/index.js";

const report = {
  root: "/tmp/example",
  generatedAt: "deterministic",
  summary: { safe: 1, caution: 0, dangerous: 0, unknown: 0, total: 1 },
  recommendedSequence: [{ name: "test", command: "npm test", reason: "Tests", risk: "safe" }],
  commands: [
    {
      id: "package.json#scripts.test",
      name: "test",
      command: "npm test",
      kind: "package-json",
      location: { file: "package.json" },
      risk: "safe",
      score: -5,
      evidence: [],
      tools: ["npm"],
      sideEffects: [],
      network: false,
      verificationValue: 40
    }
  ]
};

test("renders markdown reports", () => {
  const output = renderReport(report, "markdown");
  assert.match(output, /# ScriptAudit Report/);
  assert.match(output, /npm test/);
});

test("renders json reports", () => {
  const output = renderReport(report, "json");
  assert.equal(JSON.parse(output).summary.total, 1);
});
