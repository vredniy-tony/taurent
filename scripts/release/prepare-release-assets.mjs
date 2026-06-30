import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const RELEASE_TAG_PATTERN = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const REQUIRED_SUFFIXES = new Set([
  'macos-arm64.dmg',
  'macos-x64.dmg',
  'windows-x64-setup.exe',
  'linux-x64.AppImage',
  'linux-x64.deb',
  'linux-x64.rpm',
  'android-universal-unsigned.apk',
]);

function findFiles(root) {
  const files = [];
  const entries = readdirSync(root, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function firstPathSegment(path) {
  return path.split(sep)[0] ?? '';
}

function classifyAsset(sourceDir, file, releaseTag) {
  const relativePath = relative(sourceDir, file);
  const artifact = firstPathSegment(relativePath);
  const fileName = basename(file);
  const lowerName = fileName.toLowerCase();

  if (artifact === 'taurent-macos-apple-silicon' && lowerName.endsWith('.dmg')) {
    return `Taurent-${releaseTag}-macos-arm64.dmg`;
  }

  if (artifact === 'taurent-macos-intel' && lowerName.endsWith('.dmg')) {
    return `Taurent-${releaseTag}-macos-x64.dmg`;
  }

  if (artifact === 'taurent-windows' && lowerName.endsWith('.exe') && lowerName.includes('setup')) {
    return `Taurent-${releaseTag}-windows-x64-setup.exe`;
  }

  if (artifact === 'taurent-linux') {
    if (fileName.endsWith('.AppImage')) {
      return `Taurent-${releaseTag}-linux-x64.AppImage`;
    }

    if (lowerName.endsWith('.deb')) {
      return `Taurent-${releaseTag}-linux-x64.deb`;
    }

    if (lowerName.endsWith('.rpm')) {
      return `Taurent-${releaseTag}-linux-x64.rpm`;
    }
  }

  if (artifact.startsWith('taurent-android') && lowerName.endsWith('.apk')) {
    return `Taurent-${releaseTag}-android-universal-unsigned.apk`;
  }

  return '';
}

export function prepareReleaseAssets({
  sourceDir,
  outputDir,
  releaseTag,
} = {}) {
  if (!releaseTag || !RELEASE_TAG_PATTERN.test(releaseTag)) {
    throw new Error(`RELEASE_TAG must be v-prefixed SemVer. Got: ${releaseTag || '<missing>'}`);
  }

  if (!sourceDir || !statSync(sourceDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Release asset source directory does not exist: ${sourceDir || '<missing>'}`);
  }

  if (!outputDir) {
    throw new Error('Release upload directory is required.');
  }

  const selected = new Map();
  const skipped = [];

  for (const file of findFiles(sourceDir)) {
    const targetName = classifyAsset(sourceDir, file, releaseTag);
    if (!targetName) {
      skipped.push(relative(sourceDir, file));
      continue;
    }

    const existing = selected.get(targetName);
    if (existing) {
      throw new Error(
        `Multiple files map to ${targetName}: ${relative(sourceDir, existing)} and ${relative(sourceDir, file)}`,
      );
    }

    selected.set(targetName, file);
  }

  const missing = [...REQUIRED_SUFFIXES]
    .map((suffix) => `Taurent-${releaseTag}-${suffix}`)
    .filter((targetName) => !selected.has(targetName));

  if (missing.length > 0) {
    throw new Error(`Missing required release assets:\n${missing.map((name) => `  - ${name}`).join('\n')}`);
  }

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  const copied = [];
  for (const [targetName, source] of [...selected.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const target = join(outputDir, targetName);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
    copied.push(targetName);
  }

  return { copied, skipped };
}

function main() {
  const releaseTag = process.env.RELEASE_TAG;
  const sourceDir = process.env.RELEASE_ASSETS_DIR ?? process.argv[2] ?? 'release-assets';
  const outputDir = process.env.RELEASE_UPLOAD_DIR ?? process.argv[3] ?? 'release-upload';
  const result = prepareReleaseAssets({ sourceDir, outputDir, releaseTag });

  console.log('Prepared release assets:');
  for (const asset of result.copied) {
    console.log(`  ${asset}`);
  }

  if (result.skipped.length > 0) {
    console.log('Skipped non-public release artifacts:');
    for (const asset of result.skipped.sort()) {
      console.log(`  ${asset}`);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
