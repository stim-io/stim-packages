# Publishing

This file defines the canonical package publishing and consumer-install rule for the published packages in `stim-packages`.

## Quick reading guide

Use this file when the question is:

- where published `@stim-io` packages should go
- what must be verified before publish
- what publish/install paths are canonical versus local-only convenience

## Canonical registry

`@stim-io/components` and `@stim-io/shared` publish to GitHub Packages.

Use the `@stim-io` scope with:

- registry: `https://npm.pkg.github.com`
- auth token supplied outside committed repo state when publish/install actually needs it

## Repo configuration

The repo-level `.npmrc` is the canonical registry configuration for this workspace.

It should stay explicit and committed so that publish/install behavior is not hidden in local machine state.

Do not commit auth tokens. Keep auth material in user-level npm config, CI secrets, or explicit environment at publish/install time.

## First-class package boundary

Publish from:

- `packages/components/`
- `packages/shared/`

Do not publish from the workspace root.

## Required local verification before publish

Before publishing `@stim-io/components`, run:

- `pnpm -C packages/components build`
- `pnpm -C packages/components typecheck`
- `pnpm -C packages/shared typecheck`
- `pnpm -C playgrounds/chromium typecheck`
- `pnpm -C playgrounds/webkit typecheck`
- `pnpm -C e2e typecheck`
- `pnpm -C packages/components pack:dry-run`
- `pnpm -C packages/components publish:dry-run`

Before publishing `@stim-io/shared`, run:

- `pnpm -C packages/shared typecheck`
- `pnpm -C packages/shared pack:dry-run`
- `pnpm -C packages/shared publish:dry-run`

The goal is to confirm that each package payload matches the committed package boundary before publish.

## First publish command

From `modules/stim-packages/`, the explicit publish paths are:

```bash
npm publish --registry=https://npm.pkg.github.com
```

Run that command from `packages/components/` or `packages/shared/`.

That command requires valid GitHub Packages auth at publish time, but it should not require extra repo-local path tricks.

## Consumer install rule

Consumers that install `@stim-io/components` or `@stim-io/shared` should configure the `@stim-io` scope to GitHub Packages explicitly.

Do not treat repo-local `link:` dependencies as the canonical install path.

Positive example:

- consumer repo configures the `@stim-io` scope to GitHub Packages and installs a published beta version

Negative example:

- consumer behavior depends on repo-local `file:` or `link:` wiring as if that were the real published boundary

## Current release stance

Beta package publishing is manually dispatched through `.github/workflows/publish-beta.yml`.

The operator provides:

- package: `components` or `shared`
- beta version: `<major>.<minor>.<patch>-beta.<n>`
- optional ref to publish from, defaulting to `main`

The workflow verifies and publishes from that ref first, then creates the canonical success tag after publish succeeds.

Supported beta success tag shapes are:

- `components-v<version>-beta.<n>`
- `shared-v<version>-beta.<n>`

Each beta tag marks a commit that has already been successfully published for one package/version pair.

The requested beta version must match the package's `major.minor.patch` base version. The workflow then temporarily rewrites the target package's `version` field to the full beta version while running verification and publish, so the repo can keep the stable base version checked in between beta publishes.
