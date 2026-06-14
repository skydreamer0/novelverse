# Root Agent Instructions

This root workspace owns the Novel-to-Scene pipeline design and generated pipeline artifacts.

## Workspace Boundaries

- `novel/` is a mutable reference source for the novel, reader app, and internal canon data.
- Do not place new Novel-to-Scene specs, plans, schemas, or generated scene-card artifacts inside `novel/` unless the user explicitly asks for that.
- Put root-level pipeline documentation under `docs/`.
- Put future generated pipeline artifacts under `03_SCENE_PIPELINE/` unless a later root-level plan changes the location.
- Treat `novel/02_PROJECT_DATABASE/04_ARCHIVE/` as historical reference only, not current evidence.

## Novel-to-Scene Consensus

- Start extraction from chapter 1 and move forward in story order.
- Use extraction-first: chapter text -> evidence -> Scene Card -> Visual Brief -> HTML Scene Brief -> playable scene.
- The chapter text is the primary source. Canon files can support interpretation, but they must not overwrite chapter evidence.
- The novel changes over time, so generated cards are rebuildable derivatives, not source of truth.
- Reader-safe output must not leak future chapter truths, author notes, AI process language, or internal planning terms.
- Every material scene claim should carry evidence or remain an internal candidate.

## AI Operating Rules

- Prefer deterministic stages over one large prompt.
- Use structured JSON outputs with schema validation once implementation begins.
- Separate reader-safe fields from internal maintenance fields.
- Mark stale outputs when source hashes change.
- Record warnings instead of silently resolving conflicts between chapter text and canon support.
- Do not edit novel prose or reader app files while working on pipeline docs or artifacts unless the user asks.

## Encoding

All Traditional Chinese text files in this workspace must be UTF-8 without BOM.

