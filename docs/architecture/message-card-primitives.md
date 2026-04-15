# Message Card Primitives

This document defines the first shared primitive set for Slice 7 message-card work.

## Purpose

The goal is to let `stim` render the first rich message-card path without re-owning card visuals, layout behavior, or theme styling inside the product renderer.

`stim-packages/` should provide the shared presentation primitives.
`stim/` should only assemble those primitives and declare business-facing props.

## Core rule

For message-card work:

- reusable card surfaces belong in `stim-packages/`
- reusable layout primitives belong in `stim-packages/`
- theme-aware card and layout styling belongs in `stim-packages/`
- `stim` should adapt protocol/controller data into props and compose those primitives into product screens

Do not begin by authoring product-local message-card CSS in `stim` and planning to extract it later.

## First primitive set

The first Slice 7 pass needs only a minimal shared primitive set.

### 1. `StimSurface`

Purpose:

- own the base framed surface for cards and panels
- carry theme-aware border, radius, background, and foreground styling

First-pass props should stay small and durable:

- `tone`: `default | elevated | accent | muted`
- `padding`: `none | sm | md | lg`
- `radius`: `sm | md | lg`

This primitive should not know product concepts like `assistant-message` or `thread-debug-panel`.

### 1a. `StimText`

Purpose:

- own the first shared typography treatment for small durable text roles that were otherwise leaking into renderer-local CSS
- keep theme-aware muted/body/display text styling in `stim-packages/` instead of rebuilding it per screen in `stim`

First-pass props should stay small and durable:

- `as`: bounded element choice such as `p | span | div | h1 | h2 | h3`
- `tone`: `primary | secondary`
- `size`: `body | eyebrow | display`

This primitive is not a product copy system. It is only the smallest shared typography support needed to stop repeated local text-style ownership in the renderer.

### 2. `StimStack`

Purpose:

- own reusable vertical layout spacing/alignment behavior
- remove the need for product-local stack/list spacing CSS

First-pass props:

- `gap`: `xs | sm | md | lg`
- `align`: `start | stretch | center`

This is the first explicit shared layout primitive needed by Slice 7.

### 2a. `StimViewportStage`

Purpose:

- own reusable viewport-sized stage alignment and outer padding behavior
- keep full-screen centering/start-alignment behavior out of product-local page CSS

First-pass props:

- `padding`: `md | lg | xl`
- `align`: `center | start`

### 2b. `StimInfoList`

Purpose:

- own the reusable label/value list rhythm used by debug and information panels
- keep definition-list spacing and typography treatment out of product-local CSS

First-pass props:

- `gap`: `xs | sm | md`

### 3. `StimMessageCardFrame`

Purpose:

- provide a reusable message-card wrapper above raw surface/layout atoms but still below product-specific composition
- centralize message-card framing, spacing, and vertical-pressure handling

First-pass props:

- `roleTone`: `user | assistant | system`
- `layoutFamily`: `bubble | card`
- `verticalPressure`: `compact | expand | scroll | none`
- `minHeightPx?: number`
- `maxHeightPx?: number`

This primitive is still shared presentation infrastructure, not business composition.

### 4. `StimRichContent`

Purpose:

- own the shared content container for message-card body rendering
- provide a single home for text content and the first raw rich-content direction

First-pass props:

- `kind`: `text | raw-html | stim-dom-fragment`
- `text?: string`
- `html?: string`
- `tree?: unknown`

First-pass rule:

- `StimRichContent` may support bounded `raw-html` display for the first Slice 7 path
- it should not pretend final sandbox/execution policy is already solved
- bounded structured DOM support should extend this primitive instead of creating a parallel renderer path in `stim`

## What stays in `stim`

`stim` should own only:

- message-card business composition inside the chat/thread UI
- mapping from `MessageContent.parts` into shared primitive props
- mapping from shared protocol `layout_hint` into bounded layout props
- choosing whether a given message is composed as user-facing, assistant-facing, or another product-level card arrangement

`stim` should not own:

- reusable card spacing and framing CSS
- reusable vertical-pressure behavior
- theme styling for message-card primitives
- local one-off layout wrappers that duplicate shared primitives

## First Slice 7 integration path

The first bounded implementation should land in this order:

1. add `StimSurface` and `StimStack`
2. add `StimMessageCardFrame` on top of those primitives
3. add `StimRichContent` with `text` and bounded `raw-html`
4. update `stim` to consume those primitives through thin composition only

## Acceptance for the first primitive wave

The primitive wave is sufficient when all of the following are true:

- `stim` can render text messages without product-local card CSS
- `stim` can render one bounded rich-content direction through shared primitives
- vertical-space-affecting behavior is expressed through shared props, not scattered local styles
- theme-aware card/layout styling still lives entirely in `stim-packages/`

If `stim` needs local CSS to make the shared message-card path look coherent, treat that as evidence the primitive set is still incomplete.
