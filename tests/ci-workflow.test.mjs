import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(".github/workflows/ci.yml", "utf8");

test("CI invokes the release workflow guard after installing dependencies", () => {
  const install = workflow.indexOf("npm ci");
  const guard = workflow.indexOf("npm run release:workflow-check");
  assert.notEqual(install, -1, "CI must install locked dependencies");
  assert.notEqual(guard, -1, "CI must run the release workflow guard");
  assert.ok(install < guard, "CI must install dependencies before running the guard");
});
