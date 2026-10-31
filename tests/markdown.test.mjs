import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { discoverMarkdownCommands } from "../dist/discover/markdown.js";

test("closes fenced Markdown blocks with trailing spaces and extracts following blocks", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "scriptaudit-markdown-"));
  try {
    await mkdir(path.join(root, "docs"));
    await writeFile(path.join(root, "docs", "commands.md"), [
      "```bash", "npm run first", "```   ", "```shell", "pnpm run second", "```\t", ""
    ].join("\n"));
    const commands = await discoverMarkdownCommands(root);
    assert.deepEqual(commands.map(({ command }) => command), ["npm run first", "pnpm run second"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
