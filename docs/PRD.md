# ScriptAudit PRD

Status: in-progress
Decision: build now
Factory run: 2026-05-18 PM

## One-liner

`scriptaudit` reads package scripts and local command docs, then produces a deterministic safety map so developers and agents know which commands are safe to run. 🧭

## Source attribution

Created during the 2026-05-18 evening OSS Factory run. Web search was attempted for current developer-tool pain points, but the configured provider returned an authentication/plan error. The idea is reframed from recurring local agent workflow failures around ambiguous `package.json` scripts, risky cleanup commands, hidden network calls, and missing smoke guidance.

## Target users

- OSS maintainers documenting reliable local commands.
- Agentic coding workflows choosing verification commands without guessing.
- Reviewers who want a quick command-risk appendix before running a repo.

## Problem

`package.json` scripts often mix harmless checks with mutating setup, deploy, clean, and publish commands. Agents routinely run either too little verification or commands with side effects because the repo does not label the safe path.

## Goals

- Parse package manager scripts, README command snippets, Makefiles, and common task files.
- Classify commands by risk, side effects, network hints, required tools, and likely verification value.
- Emit Markdown/JSON reports plus a recommended local verification sequence.
- Support config overrides for local policy, known-safe commands, and blocked patterns.
- Work fully offline and never execute target scripts in V1.

## Non-goals

- Running scripts or sandboxing shell commands.
- Replacing package managers or CI.
- LLM classification.

## V1 CLI

```bash
scriptaudit scan . --out docs/SCRIPTS.md
scriptaudit scan fixtures/risky --format json --fail-on high
scriptaudit init --preset oss-cli
```

## Functional requirements

1. Discover scripts from `package.json`, `pnpm-workspace.yaml`, Makefiles, README/docs fenced blocks, and common task runner files.
2. Tokenize command strings enough to detect destructive verbs, publishing/deploy hints, network tools, env file use, and generated artifact paths.
3. Rank scripts as safe, caution, dangerous, or unknown with clear evidence.
4. Recommend a deterministic verification order using tests, checks, builds, smokes, and validation scripts when present.
5. Emit stable Markdown and JSON reports with source locations.
6. Include fixture-backed tests for clean, risky, monorepo, docs-only, and config override cases.

## Acceptance criteria

- `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and `bash scripts/validate.sh` pass where present.
- Real CLI smoke scans checked-in fixtures and writes both Markdown and JSON reports.
- README covers quick start, risk model, examples, config, safety limits, and agent workflow usage.
- Public GitHub repo `rogerchappel/scriptaudit` has useful description and topics.

