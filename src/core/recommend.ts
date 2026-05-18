import type { CommandFinding, VerificationStep } from "../types.js";

const ORDER = ["check", "lint", "type", "test", "build", "smoke", "validate"];

export function recommendSequence(commands: CommandFinding[]): VerificationStep[] {
  const candidates = commands
    .filter((command) => command.verificationValue > 0)
    .filter((command) => command.risk === "safe" || command.risk === "unknown")
    .sort((left, right) => {
      const leftOrder = orderFor(left);
      const rightOrder = orderFor(right);
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return right.verificationValue - left.verificationValue || left.id.localeCompare(right.id);
    });

  const seen = new Set<string>();
  const steps: VerificationStep[] = [];
  for (const candidate of candidates) {
    const key = candidate.command;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    steps.push({
      name: candidate.name,
      command: candidate.command,
      reason: reasonFor(candidate.command),
      risk: candidate.risk
    });
  }
  return steps.slice(0, 8);
}

function orderFor(command: CommandFinding): number {
  const haystack = `${command.name} ${command.command}`.toLowerCase();
  const index = ORDER.findIndex((token) => haystack.includes(token));
  return index === -1 ? ORDER.length : index;
}

function reasonFor(command: string): string {
  const normalized = command.toLowerCase();
  if (normalized.includes("check") || normalized.includes("lint") || normalized.includes("type")) {
    return "Static verification with low expected side effects.";
  }
  if (normalized.includes("test")) {
    return "Exercises project behavior before artifact generation.";
  }
  if (normalized.includes("build")) {
    return "Confirms generated outputs compile after tests and checks.";
  }
  if (normalized.includes("smoke") || normalized.includes("validate")) {
    return "Runs project-specific smoke or validation coverage.";
  }
  return "Useful local verification candidate.";
}
