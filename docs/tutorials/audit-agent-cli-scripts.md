# Audit Agent CLI Scripts

This recipe shows how ScriptAudit can turn a small CLI repo's scripts and README command blocks into a deterministic command-safety report.

## Files

- `examples/fixtures/agent-cli/package.json`: package scripts for build, check, smoke, cleanup, dry-pack, and deploy examples.
- `examples/fixtures/agent-cli/README.md`: fenced shell commands that mirror the package scripts.
- `examples/agent-cli-audit.config.json`: marks `publish:dry` as known safe, blocks `deploy`, and downgrades `clean` to caution with an explicit reason.

## Run the demo

```bash
npm run build
node dist/cli.js scan examples/fixtures/agent-cli \
  --config ../../agent-cli-audit.config.json \
  --out examples/fixtures/agent-cli/SCRIPTS.md

node dist/cli.js scan examples/fixtures/agent-cli \
  --config ../../agent-cli-audit.config.json \
  --format json
```

## What to look for

The report should separate low-risk local verification from commands that deserve more review:

- `build`, `check`, and `smoke` are local verification candidates.
- `clean` is caution because it deletes generated files.
- `publish:dry` is treated as known safe by the demo config.
- `deploy` is blocked as dangerous by the demo config.

ScriptAudit does not execute the target commands. It reads script definitions and command docs, then renders evidence, tool hints, side-effect hints, and a recommended verification sequence.

## PR appendix template

```md
I ran ScriptAudit before choosing verification commands.

Report command:

`node dist/cli.js scan examples/fixtures/agent-cli --config ../../agent-cli-audit.config.json --out examples/fixtures/agent-cli/SCRIPTS.md`

I used the safe verification sequence first and did not run blocked deployment commands.
```
