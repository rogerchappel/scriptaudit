import assert from "node:assert/strict";
import test from "node:test";
import { classifyCommand } from "../dist/index.js";

const base = {
  id: "package.json#scripts.test",
  name: "test",
  kind: "package-json",
  location: { file: "package.json" }
};

test("classifies tests as safe verification commands", () => {
  const finding = classifyCommand({ ...base, command: "node --test" });
  assert.equal(finding.risk, "safe");
  assert.ok(finding.verificationValue > 0);
});

test("classifies destructive cleanup as dangerous", () => {
  const finding = classifyCommand({ ...base, name: "clean", command: "rm -rf dist" });
  assert.equal(finding.risk, "dangerous");
  assert.ok(finding.sideEffects.includes("filesystem"));
});

test("applies config risk overrides", () => {
  const finding = classifyCommand(
    { ...base, name: "publish:dry", command: "npm publish --dry-run" },
    { rules: [{ match: "publish:dry", risk: "safe", reason: "dry-run only" }] }
  );
  assert.equal(finding.risk, "safe");
});
