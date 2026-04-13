# Publishing

This file defines the canonical package publishing and consumer-install rule for `@stim-io/stim-components`.

## Canonical registry

`@stim-io/stim-components` publishes to GitHub Packages.

Use the `@stim-io` scope with:

- registry: `https://npm.pkg.github.com`
- auth token supplied outside committed repo state when publish/install actually needs it

## Repo configuration

The repo-level `.npmrc` is the canonical registry configuration for this workspace.

It should stay explicit and committed so that publish/install behavior is not hidden in local machine state.

Do not commit auth tokens. Keep auth material in user-level npm config, CI secrets, or explicit environment at publish/install time.

## First-class package boundary

Publish from:

- `packages/stim-components/`

Do not publish from the workspace root.

## Required local verification before publish

Before publishing, run:

- `pnpm typecheck`
- `pnpm build`
- `pnpm pack:dry-run`
- `pnpm publish:dry-run`

The goal is to confirm that the package artifact matches the committed package boundary.

## First publish command

From `modules/stim-components/`, the explicit first-publish path is:

```bash
pnpm --dir packages/stim-components exec npm publish --registry=https://npm.pkg.github.com
```

That command requires valid GitHub Packages auth at publish time, but it should not require extra repo-local path tricks.

## Consumer install rule

Consumers that install `@stim-io/stim-components` should configure the `@stim-io` scope to GitHub Packages explicitly.

Do not treat repo-local `link:` dependencies as the canonical install path.

## Current release stance

The first publish may be manual as long as it is explicit, reproducible, and based on the committed package state.

Release automation may be added later if it improves clarity without hiding the real package boundary.
