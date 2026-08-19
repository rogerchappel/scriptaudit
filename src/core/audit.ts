import { promises as fs } from "node:fs";
import path from "node:path";
import { loadConfig } from "../config.js";
import { discoverCommands } from "../discover/index.js";
import { classifyCommand } from "./classify.js";
import { recommendSequence } from "./recommend.js";
import type { AuditReport, AuditSummary, ScanOptions } from "../types.js";

export async function scanProject(options: ScanOptions): Promise<AuditReport> {
  const root = path.resolve(options.root);
  await validateRoot(root);
  const config = await loadConfig(root, options.configPath);
  const sources = await discoverCommands(root);
  const commands = sources.map((source) => classifyCommand(source, config));
  const summary = summarize(commands);

  return {
    root,
    generatedAt: "deterministic",
    summary,
    commands,
    recommendedSequence: recommendSequence(commands)
  };
}

async function validateRoot(root: string): Promise<void> {
  let stats: import("node:fs").Stats;
  try {
    stats = await fs.stat(root);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Scan root does not exist: ${root}`);
    }
    throw error;
  }

  if (!stats.isDirectory()) {
    throw new Error(`Scan root is not a directory: ${root}`);
  }
}

function summarize(commands: AuditReport["commands"]): AuditSummary {
  const summary: AuditSummary = {
    safe: 0,
    caution: 0,
    dangerous: 0,
    unknown: 0,
    total: commands.length
  };

  for (const command of commands) {
    summary[command.risk] += 1;
  }

  return summary;
}
