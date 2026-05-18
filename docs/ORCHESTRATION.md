# ScriptAudit Orchestration

ScriptAudit is designed for local agents and maintainers that need a safe command map before running verification in an unfamiliar repository.

## Agent Flow

1. Run `scriptaudit scan . --out docs/SCRIPTS.md`.
2. Read the recommended verification sequence.
3. Prefer commands ranked `safe` with high verification value.
4. Treat `caution` commands as inspect-before-run.
5. Avoid `dangerous` commands unless a human explicitly authorizes them.

## Factory Verification

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Safety Contract

- The CLI never executes discovered target commands.
- Reports are deterministic and stable for review.
- Config overrides are local files under maintainer control.
- No telemetry, secrets collection, or network calls are used by the scanner.
