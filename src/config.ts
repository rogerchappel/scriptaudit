import path from "node:path";
import { exists, readJson } from "./files.js";
import type { AuditConfig } from "./types.js";

const RISK_LEVELS = new Set(["safe", "caution", "dangerous", "unknown"]);

const CONFIG_NAMES = [
  "scriptaudit.config.json",
  ".scriptaudit.json"
];

export async function loadConfig(root: string, configPath?: string): Promise<AuditConfig> {
  if (configPath) {
    const absolutePath = path.resolve(root, configPath);
    const config = await readConfig(absolutePath);
    if (config === null) {
      throw new Error(`Config file not found: ${absolutePath}`);
    }
    return validateConfig(config, absolutePath);
  }

  for (const name of CONFIG_NAMES) {
    const candidate = path.join(root, name);
    if (await exists(candidate)) {
      return validateConfig(await readConfig(candidate), candidate);
    }
  }

  return {};
}

async function readConfig(filePath: string): Promise<unknown | null> {
  try {
    return await readJson<unknown>(filePath);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid config ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

function validateConfig(config: unknown, filePath: string): AuditConfig {
  if (!isObject(config)) fail(filePath, "root", "must be a JSON object");
  validateStringArray(config, "knownSafe", filePath);
  validateStringArray(config, "blocked", filePath);

  if (config.rules !== undefined) {
    if (!Array.isArray(config.rules)) fail(filePath, "rules", "must be an array");
    config.rules.forEach((rule, index) => {
      const field = `rules[${index}]`;
      if (!isObject(rule)) fail(filePath, field, "must be an object");
      if (typeof rule.match !== "string") fail(filePath, `${field}.match`, "must be a string");
      if (rule.risk !== undefined && (typeof rule.risk !== "string" || !RISK_LEVELS.has(rule.risk))) {
        fail(filePath, `${field}.risk`, "must be one of safe, caution, dangerous, unknown");
      }
      if (rule.reason !== undefined && typeof rule.reason !== "string") {
        fail(filePath, `${field}.reason`, "must be a string");
      }
    });
  }

  const validated = config as AuditConfig;
  return {
    knownSafe: validated.knownSafe ?? [],
    blocked: validated.blocked ?? [],
    rules: validated.rules ?? []
  };
}

function validateStringArray(config: Record<string, unknown>, field: "knownSafe" | "blocked", filePath: string): void {
  const value = config[field];
  if (value === undefined) return;
  if (!Array.isArray(value)) fail(filePath, field, "must be an array of strings");
  value.forEach((entry, index) => {
    if (typeof entry !== "string") fail(filePath, `${field}[${index}]`, "must be a string");
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(filePath: string, field: string, message: string): never {
  throw new Error(`Invalid config ${filePath}: ${field} ${message}`);
}
