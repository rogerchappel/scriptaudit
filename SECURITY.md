# Security Policy

## Supported Versions

ScriptAudit is pre-1.0. Security fixes are handled on the latest `main` branch until versioned releases begin.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| `< 0.1.0` | No |

## Reporting a Vulnerability

Do not include exploit details, secrets, personal data, or sensitive repository contents in public issues.

Use GitHub private vulnerability reporting when available. If private reporting is not available, open a public issue asking for a private contact path without technical details.

## Scope

In scope:

- Bugs that cause ScriptAudit to execute target project commands.
- Report generation behavior that leaks data outside the scanned working tree.
- Unsafe defaults in config initialization, CI, or release guidance.
- Dependency vulnerabilities that affect normal CLI use.

Out of scope:

- A target repository containing inherently dangerous scripts.
- Heuristic misclassification without a security impact.
- Requests for guaranteed response or maintenance timelines.

## Safety Model

ScriptAudit is a static analyzer. It reads files and writes reports only when requested. It does not run discovered target commands, call LLM services, send telemetry, or make network requests during scanning.
