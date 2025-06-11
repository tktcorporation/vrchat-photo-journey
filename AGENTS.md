# AI Collaboration Guidelines

## Files Managed by Automation
The following files and directories are generated during development. Do **not**
modify them unless specifically instructed:

- `src/assets/licenses.json` – created by `yarn license-check:generate`.
- `yarn.lock` – maintained by Yarn.
- `CHANGELOG.md` – produced by `git-cliff`.
- `playwright/previews/` – Playwright screenshot assets.
- `debug/` – sample data (`debug/logs/`, `debug/photos/`, `debug/db/`).
- `.yarn/install-state.gz` – Yarn installation state.

## Project Layout Overview
- `electron/` – Electron main process, tRPC API and backend modules.
- `src/` – React renderer code; main app lives under `src/v2/`.
- `scripts/` – helper scripts for development and debugging.
- `docs/` – architecture documents such as `log-sync-architecture.md`.

Refer to `CLAUDE.md` and the documents in `docs/` for architectural patterns
(e.g. log synchronization order).

## Contribution Workflow
1. Run `yarn lint:fix` to automatically format code.
2. Run `yarn lint` to verify style and type checks.
3. Run `yarn test` to ensure all tests pass.

Use **Node.js 20** and **Yarn 4**. Pre‑commit hooks prevent committing if lint
fails.

Docstrings and comments should be written in **Japanese** to aid readability for
our audience.
