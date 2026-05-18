export type RiskLevel = "safe" | "caution" | "dangerous" | "unknown";

export type SourceKind =
  | "package-json"
  | "makefile"
  | "markdown"
  | "taskfile"
  | "justfile"
  | "npm-workspace";

export interface SourceLocation {
  file: string;
  line?: number;
}

export interface CommandSource {
  id: string;
  name: string;
  command: string;
  kind: SourceKind;
  location: SourceLocation;
  workspace?: string;
}

export interface Evidence {
  code: string;
  message: string;
  weight: number;
}

export interface CommandFinding extends CommandSource {
  risk: RiskLevel;
  score: number;
  evidence: Evidence[];
  tools: string[];
  sideEffects: string[];
  network: boolean;
  verificationValue: number;
}

export interface AuditSummary {
  safe: number;
  caution: number;
  dangerous: number;
  unknown: number;
  total: number;
}

export interface VerificationStep {
  name: string;
  command: string;
  reason: string;
  risk: RiskLevel;
}

export interface AuditReport {
  root: string;
  generatedAt: string;
  summary: AuditSummary;
  commands: CommandFinding[];
  recommendedSequence: VerificationStep[];
}

export interface ConfigRule {
  match: string;
  risk?: RiskLevel;
  reason?: string;
}

export interface AuditConfig {
  knownSafe?: string[];
  blocked?: string[];
  rules?: ConfigRule[];
}

export interface ScanOptions {
  root: string;
  configPath?: string;
}
