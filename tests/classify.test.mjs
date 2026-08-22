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

test("dangerous effects take precedence over verification terms", () => {
  for (const [command, evidenceCode] of [
    ["rm -rf dist && npm test", "destructive-delete"],
    ["npm test && npm publish", "publish"],
    ["npm test && vercel deploy", "deploy"]
  ]) {
    const finding = classifyCommand({ ...base, command });
    assert.equal(finding.risk, "dangerous", command);
    assert.ok(finding.evidence.some((item) => item.code === evidenceCode), command);
  }
});

test("keeps standalone verification commands safe", () => {
  for (const command of ["npm test", "npm run check", "npm run build", "npm run smoke"]) {
    assert.equal(classifyCommand({ ...base, command }).risk, "safe", command);
  }
});

test("applies config risk overrides", () => {
  const finding = classifyCommand(
    { ...base, name: "publish:dry", command: "npm publish --dry-run" },
    { rules: [{ match: "publish:dry", risk: "safe", reason: "dry-run only" }] }
  );
  assert.equal(finding.risk, "safe");
});

test("config risk overrides can explicitly downgrade dangerous evidence", () => {
  const finding = classifyCommand(
    { ...base, name: "deploy:preview", command: "npm test && vercel deploy" },
    { rules: [{ match: "deploy:preview", risk: "caution", reason: "isolated preview environment" }] }
  );
  assert.equal(finding.risk, "caution");
});
