# AGENTS

## Purpose

This file manages two things only:

- the stable role of `stim-packages/` as the shared package workspace and theme/component boundary for the `stim` product surface
- core constraints and file indexes that should stay durable while the package workspace grows

Detailed component/package design belongs in `docs/`, not here.

## Core Constraints

- `stim-packages/` owns atomic Vue components, shared layout primitives, tokens, theme definitions, and adjacent support packages for the `stim` product surface.
- `packages/aesthetic` is the explicit incubation boundary for subjective/non-mainstream code-feel helpers; graduate helpers into shared or domain packages only after real repeated pressure proves the pattern durable.
- Keep product-specific screen composition and business styling decisions out of this repo; those belong in `stim/`.
- Keep `packages/shared` below component ownership: it may provide browser/runtime primitives and package lifecycle tooling helpers, but it must not depend on `@stim-io/components`.
- Keep `packages/grid-layout` as framework-light namespace-scoped grid geometry and interaction infrastructure; product modes own layout state/selection, and full dashboard compaction, persistence, and business panel semantics stay out of this package.
- Keep styling ownership explicit: tokens and themes live here, and browser-engine patches should stay visible rather than hidden in mixed styling logic.
- Add or widen shared primitives only when real repeated product pressure shows that a concern is durable across screens; do not absorb one-off product composition leftovers just to make `stim/` look cosmetically thinner.
- Grow playground and test surfaces from real browser-engine or packaging friction, not from speculative framework process.
- Keep the published package boundary clean enough that npm publishing can stay straightforward when enabled.

## Git / CI Baseline

- `main` should advance through PRs rather than direct pushes.
- Keep force-push protection and branch-deletion protection enabled for `main`.
- Keep squash merge as the default history strategy.
- Keep required green checks in front of merge once `.github/workflows/guard.yml` is active.

## Common Commands

- Check stim-packages orchestration formatting: `pnpm run format`
- Write stim-packages orchestration formatting: `pnpm run format:write`
- Check aesthetic package formatting: `pnpm -C packages/aesthetic run format`
- Typecheck aesthetic package: `pnpm -C packages/aesthetic run typecheck`
- Check grid-layout package formatting: `pnpm -C packages/grid-layout run format`
- Write grid-layout package formatting: `pnpm -C packages/grid-layout run format:write`
- Build published package: `pnpm -C packages/components build`
- Typecheck published package: `pnpm -C packages/components typecheck`
- Typecheck shared support package: `pnpm -C packages/shared typecheck`
- Typecheck Chromium playground: `pnpm -C playgrounds/chromium typecheck`
- Typecheck WebKit playground: `pnpm -C playgrounds/webkit typecheck`
- Run Chromium playground: `pnpm -C playgrounds/chromium dev`
- Run WebKit playground: `pnpm -C playgrounds/webkit dev`
- Run e2e tests: `pnpm -C e2e test`
- Install Playwright browser: `pnpm -C e2e install:browsers`
- Check published package payload: `pnpm -C packages/components run payload`
- Dry-run release package boundary: `pnpm -C packages/components run release`
- Run repo guard gate locally: `pnpm run guard`

## Key File Index

- `AGENTS.md`: stable constraints and file index
- `docs/operations/documentation.md`: docs update guide and anti-duplication rules
- `docs/operations/publishing.md`: canonical GitHub Packages publish/install rule for the package workspace
- `docs/architecture/components.md`: canonical shared component and primitive ownership method
- `packages/aesthetic/`: `@stim-io/aesthetic` syntax-sugar incubation package for subjective code-feel helpers
- `packages/grid-layout/`: framework-light `@stim-io/grid-layout` DOM engine for namespace-scoped flat grid layout, drag, resize, preview, and layout proposal events
- `packages/playground/`: private support package for browser-engine playground composition
- `packages/*/scripts/payload.mjs`: package-local published payload verification boundary
- `packages/*/scripts/release.mjs`: package-local release command boundary
- `.github/workflows/guard.yml`: required PR-protection guard gate
- `.github/workflows/release-beta.yml`: tag-driven beta package release workflow
- `../../AGENTS.md`: repo-root workspace boundary across all attached repos

## Update Rules

- Put durable design and packaging guidance in `docs/`.
- Keep `AGENTS.md` short and stable.
- Add new indexed files here only when they are likely to remain central.
- Before changing docs structure or adding new docs, read `docs/operations/documentation.md` first.
