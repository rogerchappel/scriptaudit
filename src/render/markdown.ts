import type { AuditReport, CommandFinding } from "../types.js";

export function renderMarkdown(report: AuditReport): string {
  const lines: string[] = [
    "# ScriptAudit Report",
    "",
    `Root: \`${report.root}\``,
    "",
    "## Summary",
    "",
    `- Total commands: ${report.summary.total}`,
    `- Safe: ${report.summary.safe}`,
    `- Caution: ${report.summary.caution}`,
    `- Dangerous: ${report.summary.dangerous}`,
    `- Unknown: ${report.summary.unknown}`,
    "",
    "## Recommended Verification Sequence",
    ""
  ];

  if (report.recommendedSequence.length === 0) {
    lines.push("- No low-risk verification sequence found.");
  } else {
    report.recommendedSequence.forEach((step, index) => {
      lines.push(`${index + 1}. \`${step.command}\` - ${step.reason}`);
    });
  }

  lines.push("", "## Commands", "");
  for (const command of report.commands) {
    lines.push(...renderCommand(command), "");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderCommand(command: CommandFinding): string[] {
  const location = command.location.line
    ? `${command.location.file}:${command.location.line}`
    : command.location.file;
  const evidence = command.evidence.length > 0
    ? command.evidence.map((item) => `  - ${item.code}: ${item.message}`)
    : ["  - no matching risk evidence"];

  return [
    `### ${command.name}`,
    "",
    `- Risk: **${command.risk}** (score ${command.score})`,
    `- Source: ${command.kind} at \`${location}\``,
    `- Command: \`${command.command}\``,
    `- Tools: ${command.tools.length ? command.tools.map((tool) => `\`${tool}\``).join(", ") : "none detected"}`,
    `- Network hint: ${command.network ? "yes" : "no"}`,
    `- Side effects: ${command.sideEffects.length ? command.sideEffects.join(", ") : "none detected"}`,
    "- Evidence:",
    ...evidence
  ];
}
