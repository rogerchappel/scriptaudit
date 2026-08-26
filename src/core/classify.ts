import { matchRules } from "./rules.js";
import { tokenizeCommand } from "./tokenize.js";
import type { AuditConfig, CommandFinding, CommandSource, Evidence, RiskLevel } from "../types.js";

export function classifyCommand(source: CommandSource, config: AuditConfig = {}): CommandFinding {
  const tokens = tokenizeCommand(source.command);
  const matches = matchRules(source.command);
  const evidence: Evidence[] = matches.map((match) => match.evidence);
  const sideEffects = matches.map((match) => match.sideEffect).filter((value): value is string => Boolean(value));
  let network = matches.some((match) => match.network);

  for (const pattern of config.knownSafe ?? []) {
    if (matchesPattern(source, pattern)) {
      evidence.push({ code: "config-known-safe", message: `Marked safe by config pattern: ${pattern}`, weight: -60 });
    }
  }

  for (const pattern of config.blocked ?? []) {
    if (matchesPattern(source, pattern)) {
      evidence.push({ code: "config-blocked", message: `Blocked by config pattern: ${pattern}`, weight: 80 });
      sideEffects.push("policy-blocked");
    }
  }

  for (const rule of config.rules ?? []) {
    if (matchesPattern(source, rule.match)) {
      evidence.push({
        code: "config-rule",
        message: rule.reason ?? `Matched config rule: ${rule.match}`,
        weight: riskToWeight(rule.risk ?? "unknown")
      });
    }
  }

  if (source.kind === "npm-workspace") {
    evidence.push({ code: "workspace-hint", message: "Workspace command listing only; inspect package scripts before running.", weight: 18 });
  }

  network = network || /https?:\/\//i.test(source.command);
  const score = evidence.reduce((sum, item) => sum + item.weight, 10);
  const configuredRisk = configuredRiskFor(source, config);
  const dangerousEvidence = new Set(["destructive-delete", "deploy", "publish", "permissions", "config-blocked"]);
  const hasDangerousEvidence = evidence.some((item) => dangerousEvidence.has(item.code));
  const risk = configuredRisk ?? (hasDangerousEvidence ? "dangerous" : scoreToRisk(score, evidence.length));

  return {
    ...source,
    risk,
    score,
    evidence,
    tools: tokens.tools,
    sideEffects: [...new Set(sideEffects)],
    network,
    verificationValue: verificationValue(source.command, risk)
  };
}

function matchesPattern(source: CommandSource, pattern: string): boolean {
  return source.name.includes(pattern) || source.command.includes(pattern) || source.id.includes(pattern);
}

function configuredRiskFor(source: CommandSource, config: AuditConfig): RiskLevel | undefined {
  for (const rule of config.rules ?? []) {
    if (rule.risk && matchesPattern(source, rule.match)) {
      return rule.risk;
    }
  }
  return undefined;
}

function scoreToRisk(score: number, evidenceCount: number): RiskLevel {
  if (score >= 55) return "dangerous";
  if (score >= 20) return "caution";
  if (score <= 2) return "safe";
  return evidenceCount === 0 ? "unknown" : "safe";
}

function riskToWeight(risk: RiskLevel): number {
  if (risk === "dangerous") return 70;
  if (risk === "caution") return 25;
  if (risk === "safe") return -50;
  return 10;
}

function verificationValue(command: string, risk: RiskLevel): number {
  const normalized = command.toLowerCase();
  let value = 0;
  if (/\b(test|vitest|jest|node --test)\b/.test(normalized)) value += 40;
  if (/\b(check|typecheck|lint|eslint|tsc --noemit|tsc --noEmit)\b/.test(command)) value += 35;
  if (/\bbuild\b|\btsc\b/.test(normalized)) value += 25;
  if (/\b(smoke|validate)\b/.test(normalized)) value += 30;
  if (risk === "dangerous") value -= 60;
  if (risk === "caution") value -= 20;
  return value;
}
