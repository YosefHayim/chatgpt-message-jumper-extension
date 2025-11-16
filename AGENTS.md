# Repository Guidelines

This repository contains the AI Conversation Navigator browser extension. Use this guide when contributing or building automation around the project.

## Project Structure & Modules

- `src/` – TypeScript source (content script, popup, services, utilities). New logic should usually live under `src/services` or `src/utils`.
- `tests/` – Jest tests, plus `tests/setup.ts` for global config.
- `assets/` and `icons/` – Static files copied into `dist/` during builds.
- `docs/`, `ARCHITECTURE.md`, `TESTING.md` – High-level design and process docs.
- `old_version/` – Historical implementation; do not modify unless doing explicit migration work.

## Build, Test & Development

- `npm run dev` – Watch-mode build for rapid iteration.
- `npm run build` – Production bundle into `dist/`.
- `npm run build:chrome` / `npm run build:firefox` / `npm run build:all` – Create browser-specific packages via scripts in `scripts/`.
- `npm test` – Run Jest test suite once.
- `npm run test:watch` – Jest in watch mode.
- `npm run test:coverage` – Run tests with coverage thresholds enforced.

## Coding Style & Naming

- Language: TypeScript-first; avoid plain JS for new files.
- Formatting: Prettier with `.prettierrc` (2 spaces, semicolons, single quotes, 100-character width, sorted imports). Run your editor’s Prettier integration before committing.
- Imports: Follow order in `.prettierrc` (`react`, third-party, `~/*` alias to repo root, then relative).
- Naming: Use descriptive names (`BookmarkService`, `ConversationTrackerService`); tests mirror source names (e.g., `navigationService.test.ts`).

## Testing Guidelines

- Framework: Jest + `ts-jest`, `jsdom` environment.
- Location: Prefer `tests/*.test.ts` for service and utility tests.
- Coverage: Keep global coverage ≥90% for functions/lines/statements and ≥80% branches; service layer files have stricter thresholds (see `jest.config.js`).
- Style: Use clear `describe`/`test` blocks and follow patterns in existing tests and `TESTING.md`.

## Commits & Pull Requests

- Commits: Use conventional-style prefixes aligned with history (e.g., `feat:`, `fix:`, `chore:`) with imperative summaries.
- PRs: Keep changes focused, reference related issues, and include screenshots or GIFs for UI changes.
- Before opening a PR: ensure `npm run build` and `npm test` pass, update or add tests as needed, and refresh documentation when behavior changes.

