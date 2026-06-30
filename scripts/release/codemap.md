# scripts/release/

## Responsibility

Release packaging helpers that run after native platform jobs produce artifacts. These scripts normalize the raw Tauri output into the public GitHub Release asset set.

## Design

Node entrypoints with no third-party dependencies. Scripts should fail closed: unexpected duplicates, missing required public assets, or invalid release tags exit non-zero so the release workflow does not publish a partial or misleading release.

## Flow

The release workflow downloads build artifacts into `release-assets/`, then runs `prepare-release-assets.mjs` to filter internal updater/raw bundles and copy only renamed public packages into `release-upload/`.

## Integration

Consumed by `.github/workflows/release-build.yml` before `gh release upload` or `gh release create`.
