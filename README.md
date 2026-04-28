# stim-packages

Shared atomic Vue components and themes for `stim`.

Canonical package publishing currently targets GitHub Packages for the `@stim-io` scope.

Workspace layout:

- `packages/components`: published `@stim-io/components` package
- `packages/shared`: `@stim-io/shared`, the shared support package for browser/runtime primitives and published package lifecycle tooling below product/business composition
- `packages/playground`: `@stim-io/playground`, private playground support that may depend on both `@stim-io/components` and `@stim-io/shared`
- `playgrounds/*`: browser-engine verification surfaces that should grow from real friction
- `e2e/`: small Vitest + Playwright harness for component end-to-end checks

Current cold-start scope:

- atomic components only
- reusable layout primitives will grow here, not in `stim/`
- theme delivery through CSS variables
- explicit Chromium/WebKit theme patch split
- `tokens/` and `themes/` stay as separate first-class style layers
- playgrounds exist to expose real browser-engine friction, not to become product apps
- `e2e/` holds a small Vitest + Playwright harness for component-level end-to-end verification

If you want to run the Playwright-backed e2e checks locally, install the browser once with:

- `pnpm -C e2e install:browsers`

For package publication and consumer registry setup, read `docs/operations/publishing.md`.
