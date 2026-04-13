# Documentation Update Guide

This file defines how `stim-components/docs` should evolve.

## Goal

Keep the docs surface small, durable, and explicit about package ownership.

The target is not to grow a large docs tree. The target is to keep package and theme boundaries from drifting into tribal knowledge.

## Organizing principle

Organize docs by ownership question.

- `architecture/`: what this repo owns and where its boundary stops
- `operations/`: how the docs system itself should stay clean

## Canonical-source rule

Each durable fact should have one canonical home.

- define a package rule once
- in other places, link to it instead of restating it in full
- short navigational summaries are fine
- overlapping canon is not

## Durable-content rule

Keep:

- package ownership rules
- component/theme boundary rules
- publishing-relevant package facts that are likely to remain true
- docs maintenance rules that stay useful across implementation growth

Do not keep active docs for:

- migration notes
- phase logs
- temporary experiments
- worklists

If content is only useful as history, delete it and rely on git history.

## Wording rule

Write docs as current truth.

Avoid transition-diary wording.

Prefer explicit, durable statements about:

- what this repo owns
- what it does not own
- how documentation should stay clean

## Update process

When changing docs:

1. identify the canonical home for the fact
2. update that canonical doc first
3. trim repeated explanation elsewhere
4. add a new file only when an existing file cannot carry the fact cleanly

## Quality check before finishing

Before considering a docs update done, ask:

1. Is there one canonical place for each important fact?
2. Does the docs surface stay intentionally small?
3. Would a new reader know what this repo owns and where to look first?
