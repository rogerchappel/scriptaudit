#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="${ROOT}/tmp/smoke"

mkdir -p "${TMP_DIR}"
node "${ROOT}/dist/cli.js" scan "${ROOT}/examples/fixtures/clean" --out "${TMP_DIR}/clean.md"
node "${ROOT}/dist/cli.js" scan "${ROOT}/examples/fixtures/risky" --format json --out "${TMP_DIR}/risky.json"
node "${ROOT}/dist/cli.js" scan "${ROOT}/examples/fixtures/docs-only" --out "${TMP_DIR}/docs.md"

grep -q "ScriptAudit Report" "${TMP_DIR}/clean.md"
grep -q '"dangerous"' "${TMP_DIR}/risky.json"
grep -q "npm run deploy" "${TMP_DIR}/docs.md"

echo "scriptaudit smoke passed"
