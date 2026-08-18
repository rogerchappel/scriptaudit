import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadConfig } from "../dist/config.js";

async function configFile(value) {
  const root = await mkdtemp(path.join(os.tmpdir(), "scriptaudit-config-"));
  await writeFile(path.join(root, "config.json"), JSON.stringify(value));
  return root;
}

test("rejects malformed config containers and entries with field paths", async () => {
  const cases = [
    [[], /root must be a JSON object/],
    [{ knownSafe: [1] }, /knownSafe\[0\] must be a string/],
    [{ blocked: "deploy" }, /blocked must be an array of strings/],
    [{ rules: {} }, /rules must be an array/],
    [{ rules: [null] }, /rules\[0\] must be an object/],
    [{ rules: [{}] }, /rules\[0\]\.match must be a string/],
    [{ rules: [{ match: "deploy", risk: "critical" }] }, /rules\[0\]\.risk must be one of/],
    [{ rules: [{ match: "deploy", reason: 1 }] }, /rules\[0\]\.reason must be a string/]
  ];

  for (const [value, expected] of cases) {
    const root = await configFile(value);
    await assert.rejects(loadConfig(root, "config.json"), expected);
  }
});

test("loads a valid explicit config override", async () => {
  const root = await configFile({ knownSafe: ["test"], blocked: ["deploy"], rules: [{ match: "clean", risk: "caution", reason: "cleanup" }] });
  assert.deepEqual(await loadConfig(root, "config.json"), {
    knownSafe: ["test"], blocked: ["deploy"], rules: [{ match: "clean", risk: "caution", reason: "cleanup" }]
  });
});
