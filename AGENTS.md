# Repository Guidelines

## Project Structure & Module Organization
- `src/index.mjs` boots the Fastify server and wires Swagger/UI; `srvapp.mjs` registers routes.
- Domain modules sit under `src/routes/` (e.g. `csrqry.mjs`, `shiploc.mjs`), with shared data helpers in `src/plugins/` and database wiring in `src/module/knexconn.mjs` and `src/plugins/db.mjs`.
- Schemas live in `src/models/`; static assets surface from `public/`; runtime certificates and `.env` values belong in `config/`.
- Build artifacts are emitted into `build/`; `data/` holds reference payloads that are safe to tweak for local runs.

## Build, Test, and Development Commands
- `pnpm install` installs dependencies; stick with pnpm to avoid lockfile drift.
- `pnpm start` runs the HTTPS Fastify server from source with live reload.
- `pnpm estart` launches the esbuild pipeline in watch mode for iterative bundling.
- `pnpm build` produces a clean `build/` bundle; run this before packaging deployments.
- `pnpm prod` serves the compiled output; mimic production when verifying TLS behavior.

## Coding Style & Naming Conventions
- Use ES modules (`.mjs`) with top-level `import`/`export`; prefer single quotes and omit semicolons unless required.
- Default to two-space indentation and align multiline literals for readability (see `src/index.mjs` for reference).
- Route files stay lowercase and describe the prefix (`csrqry.mjs`), while plugins/models use descriptive camelCase (e.g. `convertCSV.mjs`).
- Keep helpers pure; expose Fastify decorators via `fastify.decorate` inside plugins rather than global state.

## Testing Guidelines
- No automated harness exists yet—when adding tests, place Fastify integration specs under `tests/routes/<name>.test.mjs` and use `fastify.inject`.
- Cover CSV export branches and database connectors with fixture-backed scenarios; ensure certificates in `config/` are stubbed or mocked.
- Document manual checks (e.g. `GET /csrqry/:id`) in PRs until automated coverage is in place.

## Commit & Pull Request Guidelines
- Follow the existing imperative, present-tense subject style (`Add plan to query PlanName...`); keep subjects under ~65 characters.
- Each PR should summarize API changes, note config impacts, and link the tracking issue; include screenshots or curl examples for new endpoints.
- Flag schema or migration updates in the description and update Swagger config when response shapes change.

## Security & Configuration Tips
- Populate `config/.env` with the required keys from `src/index.mjs`; never commit real credentials or certs.
- TLS certs (`privkey.pem`, `fullchain.pem`) must exist locally before `pnpm start`; check them into secure secrets storage, not the repo.
- Rotate Mongo and SQL connectors when adding new agents; prefer environment overrides instead of code edits.
