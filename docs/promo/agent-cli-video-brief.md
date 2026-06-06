# Video Brief: Pick Safer Commands In An Unfamiliar Repo

## Angle

Show ScriptAudit scanning a tiny CLI fixture and turning scripts plus README command blocks into a command-safety map.

## Grounded product facts

- ScriptAudit scans package scripts, Makefile targets, Justfile recipes, Taskfile commands, workspace hints, and fenced shell blocks in common repo docs.
- It classifies commands as `safe`, `caution`, `dangerous`, or `unknown`.
- It never executes discovered target scripts.
- It can render Markdown or JSON and can fail on a configured risk threshold.

## Demo flow

1. Open `examples/fixtures/agent-cli/package.json`.
2. Open `examples/agent-cli-audit.config.json`.
3. Run:

   ```bash
   npm run build
   node dist/cli.js scan examples/fixtures/agent-cli --config ../../agent-cli-audit.config.json --out examples/fixtures/agent-cli/SCRIPTS.md
   ```

4. Show the generated report's recommended sequence.
5. Point out that deploy is identified from static evidence and is not executed.

## Short hooks

- "Before you run commands in a repo you just cloned, map the command surface."
- "ScriptAudit reads the scripts; it does not run them."
- "Give agents a deterministic command-safety appendix before they touch CI or deploy scripts."
