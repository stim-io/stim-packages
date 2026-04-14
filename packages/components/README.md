# @stim-io/components

Shared atomic Vue components, tokens, and theme CSS for the `stim` product surface.

## Install

This package is published through GitHub Packages.

Configure your npm registry for the `@stim-io` scope, then install:

```bash
pnpm add @stim-io/components
```

## Exports

- package entrypoint: `@stim-io/components`
- styles tree: `@stim-io/components/styles/*`
- foundation CSS: `@stim-io/components/styles/foundation/index.css`
- theme CSS:
  - `@stim-io/components/styles/themes/light.css`
  - `@stim-io/components/styles/themes/dark.css`
- component CSS:
  - `@stim-io/components/styles/components/stim-button/common.css`
  - `@stim-io/components/styles/components/stim-button/chromium.css`
  - `@stim-io/components/styles/components/stim-button/webkit.css`

## Scope

This package owns atomic component and theme primitives.

Product-specific screen composition stays in `stim`.
