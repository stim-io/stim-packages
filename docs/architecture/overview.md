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

## Packaging rule

The package boundary should remain straightforward:

- package-facing exports should stay explicit
- `@stim-io/shared` is the current shared support package in this workspace; packages like it may grow here when they stay below product/business composition and preserve a clean published boundary
- later npm publishing should build on a clean package/workspace baseline rather than on local-development shortcuts
