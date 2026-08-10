# Release readiness

Use this checklist before cutting a release or asking for a release review.

## Local verification

```sh
npm install
npm run check
npm run test
npm run smoke
npm run package:smoke
npm run release:check
```

## Package contents

Run `npm run package:smoke` when available and review the dry-run file list for only the built runtime, README, license, and other intentional release assets.

## Automated publication

The release workflow uses npm trusted publishing (GitHub Actions OIDC) and requires the npm package to trust this repository's `release.yml` workflow. A version tag packs the package once, publishes that exact tarball to npm with public access and provenance, and attaches the same file to the GitHub release.

The release dry-run workflow exercises the same artifact handoff on relevant pull requests: it packs once and runs `npm publish <tarball> --dry-run --access public`. `npm run release:workflow-check` guards both workflows against repacking or failing to reuse the artifact.

## Notes

- Keep README examples aligned with the fixture-backed smoke command.
- Do not publish until CI is green on the release branch.
- Confirm the npm trusted publisher points to `rogerchappel/scriptaudit` and `.github/workflows/release.yml` before creating the first version tag.
- Update CHANGELOG.md with user-facing changes before tagging.
