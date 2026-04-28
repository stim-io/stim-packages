# Components Method

This file defines when a concern belongs in `stim-packages/` and when it should remain in `stim`.

## Goal

Keep `stim-packages/` focused on durable shared presentation method, not on absorbing every leftover from the product repo.

## Quick reading guide

Use this file when the question is:

- should a presentation concern stay in `stim` or move into `stim-packages`
- is a new shared primitive justified yet
- is a concern really about package boundary, styling authority, or theme/layout foundation

## This repo owns

- atomic reusable Vue components
- shared layout primitives
- shared typography treatment when it is clearly reusable
- design tokens and theme definitions
- package-boundary styling structure and browser-engine-visible styling patches

## This repo does not own

- product-specific screens or feature composition
- one-off screen-level width or copy-measure constraints
- server-side communication or protocol semantics
- product workflow choices that only make sense inside `stim`

## Promotion rule

Promote a concern into `stim-packages/` only when at least one of these is true:

- the same visual or layout concern is repeating across more than one screen or composition
- `stim` is starting to duplicate CSS or prop-shaping for the same presentation behavior
- the concern is clearly theme-owned or layout-foundation-owned rather than product-copy-owned

If none of those are true, keep the concern local.

Do not widen this repo just to make `stim/` look cosmetically thinner.

### Quick placement examples

Good candidates for `stim-packages`:

- a card frame reused across multiple screens
- a shared text treatment repeated across product surfaces
- reusable stack/layout behavior duplicated in `stim`

Keep local in `stim`:

- one screen's max-width rule
- product-copy-specific layout tuning
- a one-off composition wrapper around existing shared primitives

## Shared primitive rule

For shared UI work, prefer a small primitive surface with clear roles:

- surfaces and frames
- stacks and viewport/stage layout
- reusable information-list rhythm
- reusable message-card shells
- reusable rich-content containers
- reusable shared text treatment where repeated pressure proves it is durable

Do not create a new shared primitive just because one screen has a leftover constraint.

## Packaging rule

Package boundaries should stay explicit and publishable:

- exports should stay intentional
- declaration/build output should be good enough for downstream consumers to typecheck against the real package boundary
- do not hide cross-package coupling behind source-level alias shortcuts

## Style rule

- keep component styling under a dedicated styles tree
- use CSS variables as the default customization surface
- use Sass only as the component-package authoring layer for style-block reuse and BEM-like selector structure
- do not replace design tokens or theme boundaries with Sass variables; prefer `--stim-*` CSS variables, and discuss exceptions explicitly
- write component selectors with stable `stim-*` BEM-like class names and use Sass nesting with `&` to keep block/element/modifier boundaries visible
- keep theme composition explicit for callers
- avoid automatic style injection or aggregate helpers unless real repeated host-composition pressure proves they are necessary

## CSS variable layering rule

Use CSS variables as the styling boundary, not Sass values.

- foundation/theme tokens own cross-component values such as color, spacing, radius, control size, motion, and typography primitives
- component files own component-semantic variables such as `--stim-button-bg`, `--stim-avatar-size`, or `--stim-pane-padding`
- component defaults may map to foundation tokens, but modifiers should switch component variables rather than writing final visual properties directly
- Sass mixins may reuse state blocks or selector structure, but Sass variables must not become token or theme authority
- structural behavior such as direction, wrapping, scrolling, alignment, and role placement may stay as direct declarations when it is not a visual value boundary

Prefer this shape:

```scss
.stim-avatar {
  --stim-avatar-size: var(--stim-avatar-size-md);
  --stim-avatar-font-size: var(--stim-avatar-font-size-md);

  inline-size: var(--stim-avatar-size);
  block-size: var(--stim-avatar-size);
  font-size: var(--stim-avatar-font-size);

  &--size-sm {
    --stim-avatar-size: var(--stim-avatar-size-sm);
    --stim-avatar-font-size: var(--stim-avatar-font-size-sm);
  }
}
```

## Boundary check

Before moving a concern into `stim-packages/`, ask:

1. Is this really shared across screens or products, or only locally awkward today?
2. Is this concern visual/layout foundation rather than product composition?
3. Would published consumers benefit from this boundary being explicit?
4. Would keeping it in `stim` create repeated duplication rather than one isolated leftover?

If those answers are weak, keep the concern out of `stim-packages/`.
