import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { initConfig } from "../dist/index.js";

test("init writes oss cli config", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "scriptaudit-init-"));
  const target = await initConfig(dir, "oss-cli");
  const config = JSON.parse(await readFile(target, "utf8"));
  assert.ok(config.knownSafe.includes("test"));
  assert.ok(config.blocked.includes("deploy"));
});

test("init rejects unknown presets", async () => {
  await assert.rejects(() => initConfig(process.cwd(), "unknown"), /Unsupported preset/);
});
