import type { Evidence } from "../types.js";

export interface RuleMatch {
  evidence: Evidence;
  sideEffect?: string;
  network?: boolean;
}

const RULES: Array<{ pattern: RegExp; match: RuleMatch }> = [
  { pattern: /\brm\s+(?:[^\s;&|]+\s+)*-(?:[a-z]*[rf][a-z]*|-[a-z-]*(?:recursive|force)[a-z-]*)\b|\brimraf\b|\btrash\b/, match: evidence("destructive-delete", "Deletes files or directories.", 45, "filesystem") },
  { pattern: /\bdeploy\b|\bvercel\b|\bflyctl\b|\bnetlify\b/, match: evidence("deploy", "Looks like a deployment command.", 50, "external-service", true) },
  { pattern: /\bpublish\b|\bnpm\s+publish\b|\bchangeset\s+publish\b/, match: evidence("publish", "May publish an artifact.", 55, "registry", true) },
  { pattern: /\bcurl\b|\bwget\b|\bnc\b|\bssh\b/, match: evidence("network-tool", "Uses a network-capable tool.", 25, "network", true) },
  { pattern: /\bdocker\b|\bdocker-compose\b/, match: evidence("container", "May start containers or mutate local Docker state.", 20, "container") },
  { pattern: /\.env\b|--env-file\b/, match: evidence("env-file", "References environment files.", 15, "env") },
  { pattern: /\bsudo\b|\bchmod\b|\bchown\b/, match: evidence("permissions", "Changes permissions or escalates privileges.", 35, "permissions") },
  { pattern: /\bbuild\b|\btsc\b|\brollup\b|\bvite\s+build\b/, match: evidence("build", "Builds generated artifacts.", 8, "generated-artifacts") },
  { pattern: /\btest\b|\bvitest\b|\bjest\b|\bnode\s+--test\b/, match: evidence("test", "Runs tests and has verification value.", -15) },
  { pattern: /\blint\b|\beslint\b|\bcheck\b|\btypecheck\b/, match: evidence("check", "Runs static checks and has verification value.", -12) },
  { pattern: /\bsmoke\b|\bvalidate\b/, match: evidence("smoke", "Runs smoke or validation checks.", -10) }
];

export function matchRules(command: string): RuleMatch[] {
  const normalized = command.toLowerCase();
  return RULES.filter((rule) => rule.pattern.test(normalized)).map((rule) => rule.match);
}

function evidence(code: string, message: string, weight: number, sideEffect?: string, network = false): RuleMatch {
  return {
    evidence: { code, message, weight },
    sideEffect,
    network
  };
}
