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

The scan root must exist and be a directory. Invalid roots fail with a nonzero exit and a path-specific diagnostic instead of producing an empty audit. An existing empty directory is valid and produces a successful report with zero commands.

For a fixture-backed walkthrough, see [`docs/tutorials/audit-agent-cli-scripts.md`](docs/tutorials/audit-agent-cli-scripts.md). It scans a small agent-CLI example and shows how config can mark dry packaging as safe while blocking deployment commands.

## What It Scans

- `package.json` scripts across the repository.
- `pnpm-workspace.yaml` workspace hints.
- Makefile targets.
- Markdown shell blocks fenced with backticks or tildes and labelled `bash`, `sh`, `shell`, `console`, or `zsh` (unlabelled fences are also scanned). Each independently executable line must begin with a supported command or an optional `$` prompt. Supported commands include package and task runners, Node and shell entry points, plus risk-relevant network, container, version-control, destructive, permission, deploy, and publish tools such as `curl`, `docker`, `git`, `rm`, `sudo`, and `vercel`.
- Justfile recipes and Taskfile `cmds` entries written as scalar commands (`- npm test`) or inline mappings (`- cmd: npm test`).

Markdown blocks labelled with other languages are deliberately ignored. Prose, comments, command output, continuations that do not start with a supported command, and commands embedded later in a line are not treated as independently executable commands.

## Risk Model

- `safe`: low-risk local verification such as tests, checks, builds, and smoke commands.
- `caution`: commands with possible local side effects, generated artifacts, containers, env-file references, or network-capable tools.
- `dangerous`: destructive cleanup, deploy, publish, permission changes, or policy-blocked commands. Destructive cleanup, deploy, and publish evidence takes precedence when a compound command also runs tests, checks, builds, or smoke validation. An explicit matching config `rules` risk remains the final override.
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
An explicitly supplied `--config` path must exist. Config files are validated before scanning: `knownSafe` and `blocked` must be string arrays, while each `rules` entry requires a string `match` and may include a `risk` of `safe`, `caution`, `dangerous`, or `unknown` plus a string `reason`. Invalid files fail with the config path and precise field name.

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

## Release readiness

Use [docs/release-readiness.md](docs/release-readiness.md) before opening release PRs or tagging a release.
Version tags publish one npm tarball with trusted publishing and provenance, then attach that same tarball to the GitHub release. Pull requests that change release files dry-run publication of the packed artifact.

## License

MIT
