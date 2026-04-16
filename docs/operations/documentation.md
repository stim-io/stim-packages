# Documentation Method

This file defines how `stim-packages/docs` should stay small and useful.

## Goal

Keep the docs surface small, methodological, and durable.

The target is not to describe the repo in full.
The target is to keep package-boundary method from drifting into tribal knowledge.

## Keep rule

Keep a file only when it teaches one durable method:

- how to place shared component responsibility
- how to keep package boundaries explicit
- how to keep the docs surface clean
- how to publish through the intended package boundary

Supporting material such as a short index, anti-pattern set, or positive/negative examples may stay only when it clearly helps readers apply that method.

Delete files that mainly act as maps, overviews, or current-state description.

Methodology must remain the main body of the docs surface.

## Canonical-source rule

Each durable fact should have one canonical home.

- define a package rule once
- in other places, link to it instead of restating it in full
- short navigational summaries are fine
- overlapping canon is not

## Merge / delete rule

Prefer one stronger method file over several descriptive files.

Keep small supporting sections only when they make the method easier to apply without turning the docs back into descriptive narrative.

Delete files that mainly exist as:

- overview prose
- docs maps
- current-state inventory
- implementation narrative
- temporary experiment writeups

## Wording rule

Write docs as durable method, not as narration.

Prefer explicit rules, anti-patterns, and placement criteria.

Brief examples are useful when they illuminate the rule.

Do not let examples become the dominant content.

## Update process

When changing docs:

1. identify the canonical home for the fact
2. update that canonical doc first
3. trim repeated explanation elsewhere
4. add a new file only when an existing file cannot carry the method cleanly
5. keep any supporting index or examples short and subordinate to the method

## Quality check before finishing

Before considering a docs update done, ask:

1. Is there one canonical place for each important rule?
2. Does the docs surface stay intentionally small?
3. Could the remaining files still matter after the current implementation details change?
