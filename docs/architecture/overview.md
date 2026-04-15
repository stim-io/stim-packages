# stim-packages Architecture Overview

`stim-packages/` is the shared package workspace for the `stim` product surface.

## This repo owns

- atomic Vue components intended for reuse across the product surface
- shared layout primitives that belong below product/business composition
- design tokens
- theme definitions
- browser-engine-specific theme delivery patches when they are needed and should stay explicit

## This repo does not own

- product-specific screens or feature composition that belongs in `stim/`
- server-side communication or product protocol modeling that belongs in `stim-server/`
- paired runtime or gateway behavior that belongs in `santi/` and `santi-link/`

## Practical rule

When visual friction appears in `stim/`, prefer asking whether the missing capability is really:

- a reusable atom
- a reusable layout primitive
- a token/theme issue

If yes, solve it here rather than pushing long-lived styling ownership back into `stim/`.

Message-card work follows the same rule strictly: if `stim` needs reusable card surfaces, reusable layout pressure handling, or theme-aware message-card styling, that capability belongs here rather than in product-local renderer CSS.

## Packaging rule

The package boundary should remain straightforward:

- package-facing exports should stay explicit
- `@stim-io/shared` is the current shared support package in this workspace; packages like it may grow here when they stay below product/business composition and preserve a clean published boundary
- later npm publishing should build on a clean package/workspace baseline rather than on local-development shortcuts

## TypeScript package-boundary rule

- Do not use local `baseUrl` / `paths` remapping to reach across package source trees.
- Prefer real workspace package boundaries plus emitted declarations so downstream consumers typecheck the same way published consumers will.
- When a package needs type visibility across the workspace, fix the package build/declaration output rather than introducing source-level alias shortcuts.

## Build and script ownership rule

- Keep package-specific build orchestration inside the package that owns it.
- Avoid top-level workspace `scripts` that mainly replay child-package commands or preserve migration history.
- Document common operator entrypoints as direct `pnpm -C <dir> ...` commands rather than adding a thin orchestration layer by default.

## Style structure rule

- Keep component styling under a dedicated styles tree rather than mixed into Vue implementation files.
- Prefer CSS variables as the default customization surface, including small design-detail values unless a mechanism-level exception is truly needed.
- The current canonical layer split is `styles/foundation/`, `styles/themes/`, and `styles/components/`.
- Keep theme composition explicit for callers; avoid package-level automatic style injection or aggregate theme helpers unless real host-composition pressure proves they are needed.
