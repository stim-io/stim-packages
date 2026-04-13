# AGENTS

## Purpose

This file manages two things only:

- the stable role of `stim-components/` as the shared atomic component and theme boundary for the `stim` product surface
- core constraints and file indexes that should stay durable while the package workspace grows

Detailed component/package design belongs in `docs/`, not here.

## Core Constraints

- `stim-components/` owns atomic Vue components, shared layout primitives, tokens, and theme definitions for the `stim` product surface.
- Keep product-specific screen composition and business styling decisions out of this repo; those belong in `stim/`.
- Keep styling ownership explicit: tokens and themes live here, and browser-engine patches should stay visible rather than hidden in mixed styling logic.
- Grow playground and test surfaces from real browser-engine or packaging friction, not from speculative framework process.
- Keep the published package boundary clean enough that npm publishing can stay straightforward when enabled.

## Git / CI Baseline

- `main` should advance through PRs rather than direct pushes.
- Keep force-push protection and branch-deletion protection enabled for `main`.
- Keep squash merge as the default history strategy.
- Keep required green checks in front of merge once `.github/workflows/ci.yml` is active.

## Key File Index

- `AGENTS.md`: stable constraints and file index
- `README.md`: workspace/package overview and local verification notes
- `docs/README.md`: docs structure map and canonical doc entrypoint
- `docs/operations/documentation.md`: docs update guide and anti-duplication rules
- `docs/operations/publishing.md`: canonical GitHub Packages publish/install rule for the package workspace
- `docs/architecture/overview.md`: package-boundary and ownership overview
- `.github/workflows/ci.yml`: minimal continuous-integration baseline for build and typecheck
- `../../AGENTS.md`: repo-root workspace boundary across all attached repos

## Update Rules

- Put durable design and packaging guidance in `docs/`.
- Keep `AGENTS.md` short and stable.
- Add new indexed files here only when they are likely to remain central.
- Before changing docs structure or adding new docs, read `docs/operations/documentation.md` first.
