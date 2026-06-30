# scripts/

## Responsibility

Root automation entrypoint for CI and release helper scripts. The directory exists to give CI runners and task runners a stable location to invoke workspace-level checks and packaging preparation.

## Design

Small, dependency-free Node and shell entrypoints grouped by workflow:

- `scripts/ci/` validates workspace state before CI/builds proceed.
- `scripts/release/` filters and renames native build artifacts before GitHub Release upload.

## Flow

No application runtime logic. Scripts are invoked by package scripts, local hooks, or GitHub Actions.

## Integration

Consumed by CI runners and release jobs. Child scripts inspect workspace manifests, run package-filtered coverage/version checks, and prepare public release artifacts.
