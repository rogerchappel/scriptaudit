import path from "node:path";
import { loadConfig } from "../config.js";
import { discoverCommands } from "../discover/index.js";
import { classifyCommand } from "./classify.js";
import { recommendSequence } from "./recommend.js";
import type { AuditReport, AuditSummary, ScanOptions } from "../types.js";

export async function scanProject(options: ScanOptions): Promise<AuditReport> {
  const root = path.resolve(options.root);
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
