# ScriptAudit

ScriptAudit reads package scripts and local command docs, then produces a deterministic safety map so developers and coding agents know which commands are reasonable to run.

It is local-first: it scans files, classifies command strings, and writes reports. It never executes discovered target scripts.

## Install

```bash
npm install
npm run build
```

Use the local CLI during development:

```bash
node dist/cli.js scan . --out docs/SCRIPTS.md
```

After package installation, the binary is:

```bash
scriptaudit scan . --out docs/SCRIPTS.md
```

## Quick Start

```bash
scriptaudit scan . --out docs/SCRIPTS.md
scriptaudit scan examples/fixtures/risky --format json --fail-on dangerous
scriptaudit init --preset oss-cli
```

## What It Scans

- `package.json` scripts across the repository.
- `pnpm-workspace.yaml` workspace hints.
- Makefile targets.
- README, CONTRIBUTING, SECURITY, TASKS, and ORCHESTRATION fenced shell blocks.
- Justfile recipes and simple Taskfile commands.

## Risk Model

- `safe`: low-risk local verification such as tests, checks, builds, and smoke commands.
- `caution`: commands with possible local side effects, generated artifacts, containers, env-file references, or network-capable tools.
- `dangerous`: destructive cleanup, deploy, publish, permission changes, or policy-blocked commands.
- `unknown`: commands without enough evidence to recommend confidently.

Each report includes evidence, detected tools, side-effect hints, network hints, and a recommended verification sequence.

## Config

Create `scriptaudit.config.json` with:

```json
{
  "knownSafe": ["publish:dry"],
  "blocked": ["deploy"],
  "rules": [
    {
      "match": "clean",
      "risk": "caution",
      "reason": "Cleanup deletes generated files."
    }
  ]
}
```

Config matching is intentionally simple and deterministic: a pattern matches a command id, script name, or command string.

## Safety Limits

ScriptAudit is a static heuristic tool, not a shell sandbox. It does not prove that a command is safe, and it does not replace maintainer judgment. Treat reports as a review appendix before running commands in an unfamiliar repo.

## Agent Workflow

1. Run `scriptaudit scan . --out docs/SCRIPTS.md`.
2. Read the recommended sequence first.
3. Run `safe` verification commands before broader checks.
4. Ask for human approval before running `dangerous` commands.
5. Keep generated reports in review artifacts when command choice matters.

## Verify

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## License

MIT
