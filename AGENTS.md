# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the TypeScript backend (entry point: `src/App.ts`) with domain code in `src/models/`, request handling in `src/controller/` and `src/rest/`, and query helpers in `src/queryScripts/`.
- `test/` holds integration-style specs and fixtures (see `test/resources/`).
- `test-unit/` contains unit tests (e.g., `*.spec.ts`).
- `frontend/frontend-vite/` is the React + Vite client, with its own `package.json` and `src/` tree.

## Build, Test, and Development Commands
Backend (from repo root):
- `yarn install` installs dependencies.
- `yarn build` runs `tsc` then ESLint.
- `yarn start` runs the server via `ts-node`.
- `yarn test` runs Mocha tests under `test/`.
- `yarn cover` runs tests with NYC coverage reports.
- `yarn lint` / `yarn fix` lint or auto-fix issues.

Frontend (from `frontend/frontend-vite/`):
- `yarn install` then `yarn dev` to run the UI locally.
- `yarn build` for production output, `yarn preview` to serve it.

## Coding Style & Naming Conventions
- Indentation: tabs with size 4; trim trailing whitespace (`.editorconfig`).
- TypeScript style is enforced via ESLint + Prettier; use `yarn lint` / `yarn pretty`.
- Naming: types are `PascalCase`; variables are `camelCase` or `UPPER_CASE` (ESLint rules).
- Line length guideline: 120 characters (ESLint).

## Testing Guidelines
- Frameworks: Mocha + Chai with `ts-node` for TypeScript specs.
- Test files follow `*.spec.ts` and are discovered recursively.
- Run backend tests with `yarn test`; coverage with `yarn cover`.

## Commit & Pull Request Guidelines
- Commit messages in history are short, descriptive sentences (e.g., “Update README.md”). Use the same style.
- PRs should include a clear summary, test evidence (commands run and results), and screenshots for UI changes.

## Configuration Tips
- Node.js version: 18.x (see `package.json` engines and `.nvmrc`).
- Git hooks are configured via `postinstall` to use `.githooks/`.
