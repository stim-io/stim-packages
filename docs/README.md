# Docs Map

`docs/` is organized by question, not by implementation phase.

- `architecture/`: package boundary, ownership split, and durable component/theme rules
- `operations/`: how the docs system should stay clean and how publication/maintenance rules should be applied

Read `docs/operations/documentation.md` before making structural docs changes.

Preferred sub-structure:

- `architecture/overview.md`: what `stim-packages` owns and what it should not absorb
- `architecture/message-card-primitives.md`: first shared card/layout/theme primitive plan for Slice 7 message-card work
- `operations/documentation.md`: canonical docs update guide and anti-duplication rules
- `operations/publishing.md`: canonical GitHub Packages publish/install rule

If two docs repeat the same fact in full, move that fact to one canonical home and link to it elsewhere.
