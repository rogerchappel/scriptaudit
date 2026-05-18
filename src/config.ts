import path from "node:path";
import { exists, readJson } from "./files.js";
import type { AuditConfig } from "./types.js";

const CONFIG_NAMES = [
  "scriptaudit.config.json",
  ".scriptaudit.json"
];

export async function loadConfig(root: string, configPath?: string): Promise<AuditConfig> {
  if (configPath) {
    const absolutePath = path.resolve(root, configPath);
    return normalizeConfig(await readJson<AuditConfig>(absolutePath));
  }

  for (const name of CONFIG_NAMES) {
    const candidate = path.join(root, name);
    if (await exists(candidate)) {
      return normalizeConfig(await readJson<AuditConfig>(candidate));
    }
  }

  return {};
}

function normalizeConfig(config: AuditConfig | null): AuditConfig {
  if (!config) {
    return {};
  }
  return {
    knownSafe: config.knownSafe ?? [],
    blocked: config.blocked ?? [],
    rules: config.rules ?? []
  };
}
