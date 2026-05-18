#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { scanProject } from "./core/audit.js";
import { initConfig } from "./init.js";
import { renderReport, type OutputFormat } from "./render/index.js";
import type { RiskLevel } from "./types.js";

const program = new Command();

program
  .name("scriptaudit")
  .description("Audit local scripts and command docs without executing them.")
  .version("0.1.0");

program
  .command("scan")
  .argument("[root]", "project root to scan", ".")
  .option("--format <format>", "output format: markdown or json", "markdown")
  .option("--out <path>", "write report to a file")
  .option("--config <path>", "config file path, relative to root")
  .option("--fail-on <risk>", "exit non-zero when this risk or higher is present")
  .action(async (rootArg: string, options: ScanCommandOptions) => {
    const root = path.resolve(process.cwd(), rootArg);
    const format = parseFormat(options.format);
    const report = await scanProject({ root, configPath: options.config });
    const output = renderReport(report, format);

    if (options.out) {
      const outPath = path.resolve(process.cwd(), options.out);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, output);
    } else {
      process.stdout.write(output);
    }

    if (options.failOn && shouldFail(report.summary, options.failOn)) {
      throw new Error(`Risk threshold met: ${options.failOn}`);
    }
  });

program
  .command("init")
  .description("Write a starter scriptaudit.config.json.")
  .option("--preset <preset>", "config preset", "oss-cli")
  .argument("[root]", "project root", ".")
  .action(async (rootArg: string, options: { preset: string }) => {
    const target = await initConfig(path.resolve(process.cwd(), rootArg), options.preset);
    process.stdout.write(`Wrote ${target}\n`);
  });

interface ScanCommandOptions {
  format: string;
  out?: string;
  config?: string;
  failOn?: RiskLevel;
}

function parseFormat(format: string): OutputFormat {
  if (format === "json" || format === "markdown") {
    return format;
  }
  throw new Error(`Unsupported format: ${format}`);
}

function shouldFail(summary: Record<RiskLevel, number>, failOn: RiskLevel): boolean {
  const order: RiskLevel[] = ["safe", "unknown", "caution", "dangerous"];
  const threshold = order.indexOf(failOn);
  return order.slice(threshold).some((risk) => summary[risk] > 0);
}

program.parseAsync(process.argv).catch((error: unknown) => {
  process.stderr.write(`${(error as Error).message}\n`);
  process.exitCode = 1;
});
