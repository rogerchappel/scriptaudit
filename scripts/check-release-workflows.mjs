import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const release = await readFile(".github/workflows/release.yml", "utf8");
const dryRun = await readFile(".github/workflows/release-dry-run.yml", "utf8");
const trustedPublishingNpmVersion = "11.5.1";

function assertTrustedPublishingNpm(workflow, name) {
  const prepareIndex = workflow.indexOf("- name: Prepare trusted publishing npm");
  const installIndex = workflow.indexOf("- name: Install dependencies");

  assert.notEqual(prepareIndex, -1, `${name} must prepare npm for trusted publishing`);
  assert.ok(
    prepareIndex < installIndex,
    `${name} must prepare trusted publishing npm before dependency installation`,
  );
  assert.match(
    workflow,
    new RegExp(`npm install --global npm@${trustedPublishingNpmVersion.replaceAll(".", "\\.")}`),
    `${name} must pin npm ${trustedPublishingNpmVersion}`,
  );
  assert.match(
    workflow.slice(prepareIndex, installIndex),
    /npm --version/,
    `${name} must print the effective npm version`,
  );
}

function assertSinglePack(workflow, name) {
  assert.equal(
    workflow.match(/\bnpm pack\b/g)?.length ?? 0,
    1,
    `${name} must pack exactly once`,
  );
  assert.match(workflow, /id: package/);
  assert.match(workflow, /npm pack --json/);
  assert.match(workflow, /echo "path=\$package_path" >> "\$GITHUB_OUTPUT"/);
}

assertSinglePack(release, "release workflow");
assertSinglePack(dryRun, "release dry-run workflow");
assertTrustedPublishingNpm(release, "release workflow");
assertTrustedPublishingNpm(dryRun, "release dry-run workflow");

assert.match(
  release,
  /npm publish "\$\{\{ steps\.package\.outputs\.path \}\}" --access public --provenance/,
  "release workflow must publish the packed artifact publicly with provenance",
);
assert.match(
  release,
  /gh release create[\s\S]*"\$\{\{ steps\.package\.outputs\.path \}\}"/,
  "GitHub release must attach the same packed artifact",
);
assert.match(
  dryRun,
  /npm publish "\$\{\{ steps\.package\.outputs\.path \}\}" --dry-run --access public/,
  "dry run must publish the packed artifact without repacking",
);

console.log(
  `release workflows prepare npm ${trustedPublishingNpmVersion}, pack once, and reuse the package artifact`,
);
