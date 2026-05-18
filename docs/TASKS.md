# ScriptAudit Tasks

## V1 Scope

- [x] Scaffold a TypeScript OSS CLI package with StackForge.
- [x] Copy the PRD into `docs/PRD.md`.
- [x] Discover commands from package manifests, Makefiles, Markdown command blocks, Taskfiles, Justfiles, and pnpm workspaces.
- [x] Classify command risk without executing target commands.
- [x] Render deterministic Markdown and JSON reports.
- [x] Recommend a local verification sequence.
- [x] Support `scriptaudit init --preset oss-cli` for policy overrides.
- [x] Add fixtures for clean, risky, monorepo, docs-only, and config override cases.
- [x] Add tests, smoke checks, and repository validation.

## Follow-up Backlog

- [ ] Add richer shell parsing for nested command substitutions and complex pipelines.
- [ ] Support more task runners such as Turbo, Nx, and Moon with first-class parsers.
- [ ] Add SARIF output for code scanning ingestion.
- [ ] Add optional config schema validation and `scriptaudit config check`.
- [ ] Publish release artifacts after maintainer review.
