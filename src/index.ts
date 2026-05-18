export { scanProject } from "./core/audit.js";
export { classifyCommand } from "./core/classify.js";
export { discoverCommands } from "./discover/index.js";
export { renderReport } from "./render/index.js";
export { initConfig } from "./init.js";
export type {
  AuditConfig,
  AuditReport,
  CommandFinding,
  CommandSource,
  Evidence,
  RiskLevel,
  ScanOptions,
  VerificationStep
} from "./types.js";
