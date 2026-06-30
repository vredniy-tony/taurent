import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const scriptPath = resolve(repoRoot, 'scripts/ci/check-versions.mjs');

function createFixture(version) {
  const root = mkdtempSync(resolve(tmpdir(), 'taurent-version-check-'));
  const files = {
    'apps/desktop/package.json': JSON.stringify({ version }, null, 2),
    'apps/desktop/src-tauri/tauri.conf.json': JSON.stringify({ version }, null, 2),
    'apps/desktop/src-tauri/Cargo.toml': `[package]\nname = "taurent"\nversion = "${version}"\n`,
    'apps/mobile/package.json': JSON.stringify({ version }, null, 2),
    'apps/mobile/src-tauri/tauri.conf.json': JSON.stringify({ version }, null, 2),
    'apps/mobile/src-tauri/Cargo.toml': `[package]\nname = "taurent-mobile"\nversion = "${version}"\n`,
  };

  for (const [file, contents] of Object.entries(files)) {
    mkdirSync(resolve(root, dirname(file)), { recursive: true });
    writeFileSync(resolve(root, file), contents);
  }

  return root;
}

function runCheck(root, releaseTag) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    env: {
      ...process.env,
      RELEASE_TAG: releaseTag,
    },
    encoding: 'utf8',
  });
}

test('accepts matching manifest versions and release tag', () => {
  const result = runCheck(createFixture('0.9.0-beta.3'), 'v0.9.0-beta.3');

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Release tag matches app version: v0\.9\.0-beta\.3/);
});

test('rejects release tag drift from manifest versions', () => {
  const result = runCheck(createFixture('1.0.0'), 'v0.9.0-beta.3');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release tag v0\.9\.0-beta\.3 does not match app version 1\.0\.0/);
});

test('rejects non-SemVer release tags', () => {
  const result = runCheck(createFixture('1.0.0'), 'vnext');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release tag must be v-prefixed SemVer/);
});
