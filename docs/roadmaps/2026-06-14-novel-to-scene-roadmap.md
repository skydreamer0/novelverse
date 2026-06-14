# Novel-to-Scene Roadmap

> **Date:** 2026-06-14
> **Status:** Draft
> **Scope:** Root-level roadmap for building the Novel-to-Scene pipeline. `novel/` remains the mutable reference source; roadmap, specs, schemas, and generated pipeline artifacts live at root.

---

## 1. North Star

Build a pipeline that turns the novel into evidence-backed, visualizable, and eventually playable scenes:

```text
novel chapter text
  -> evidence
  -> chapter Scene Card
  -> scene-level cards
  -> Visual Brief
  -> HTML Scene Brief
  -> playable / interactive HTML scene
```

The system must stay loyal to the novel. It should help AI run smoothly by using staged extraction, schema validation, source hashes, and reader-safe projections instead of one large freeform generation prompt.

## 2. Current Consensus

- Start from chapter 1 and move forward in story order.
- Use `novel/` only as a reference source.
- Put pipeline docs and artifacts at root.
- Treat chapter text as primary evidence.
- Use canon files only as support, not as a replacement for chapter evidence.
- Keep generated Scene Cards rebuildable because the novel will keep changing.
- Do not leak future chapter truths into reader-safe fields.
- Do not generate HTML or image prompts until Scene Card and Visual Brief pass validation.

## 3. Proposed Root Layout

```text
docs/
  roadmaps/
    2026-06-14-novel-to-scene-roadmap.md
  superpowers/
    specs/
      2026-06-14-novel-to-scene-extraction-design.md
    plans/
      YYYY-MM-DD-novel-to-scene-extraction.md

03_SCENE_PIPELINE/
  schemas/
    chapter-scene-card.schema.json
  scene-cards/
    ch001.json
  reports/
    ch001-validation.md
  visual-briefs/
  html-scene-briefs/
  prototypes/
```

## 4. Phase 0 - Foundation

**Goal:** Make the repo easy for AI agents to operate safely.

**Deliverables:**

- Root `AGENTS.md` with workspace boundaries and extraction rules.
- Root `.gitignore` for local helper artifacts.
- Design spec for extraction-first pipeline.
- This roadmap.

**Acceptance:**

- A new AI agent can tell that `novel/` is reference-only.
- A new AI agent knows generated pipeline artifacts belong under `03_SCENE_PIPELINE/`.
- The spec clearly bans direct HTML generation before Scene Card validation.

**Status:** mostly done.

## 5. Phase 1 - Chapter 1 Scene Card MVP

**Goal:** Produce one valid `chapter_scene_card` for chapter 1.

**Deliverables:**

- `03_SCENE_PIPELINE/schemas/chapter-scene-card.schema.json`
- `03_SCENE_PIPELINE/scene-cards/ch001.json`
- `03_SCENE_PIPELINE/reports/ch001-validation.md`
- Minimal validation command documented in the implementation plan.

**Pipeline:**

```text
source manifest
  -> evidence pass
  -> entity pass
  -> temporal beat pass
  -> spatial relation pass
  -> interaction seed pass
  -> reader-safe projection
  -> validation report
```

**Acceptance:**

- `ch001.json` validates against schema.
- Every `sceneBeat` has evidence.
- Every formal character, location, object, institution, spatial predicate, and interaction seed has evidence or explicit canon support.
- `sourceHash` is present.
- No `04_ARCHIVE` evidence is used.
- Reader-safe fields contain no author notes, AI process language, or future spoilers.

## 6. Phase 2 - Chapter 1-5 Batch

**Goal:** Test whether the schema holds across different early chapter types.

**Deliverables:**

- `ch001.json` through `ch005.json`
- Batch validation report.
- Schema revision notes if chapter 2-5 reveal missing fields.

**Acceptance:**

- Five cards validate.
- The schema handles repair scenes, terminal/system pressure, black market exchanges, fracture missions, and first power activation without ad hoc fields.
- Any schema change is versioned.

## 7. Phase 3 - Scene-Level Split

**Goal:** Split chapter-level cards into smaller scene cards once the chapter-card model is stable.

**Deliverables:**

- Scene-card schema extension or separate `scene-card.schema.json`.
- Chapter 1 split into scene cards:
  - maintenance duct / oxygen repair
  - public terminal / tax notice
  - black market / Su Lan mission chip
  - seventh deployment belt / mission entry
- Mapping from chapter card to scene cards.

**Acceptance:**

- Scene cards preserve evidence from the chapter card.
- Scene cards can be recomposed into the chapter card without losing major beats.
- No scene card invents visual details beyond evidence or validated Visual Brief seeds.

## 8. Phase 4 - Visual Briefs

**Goal:** Convert evidence-backed scene data into visual generation specs without making assets yet.

**Deliverables:**

- `visual-brief.schema.json`
- Visual Brief for one chapter 1 scene.
- Validation rules for palette, lighting, props, layout, sensory mood, and forbidden unsupported details.

**Acceptance:**

- Visual Brief can be reviewed by a human before any HTML or image generation.
- Every major visual claim maps to `evidenceIds` or `spatialPredicateIds`.
- Visual Brief distinguishes literal evidence from inferred art direction.

## 9. Phase 5 - HTML Scene Briefs

**Goal:** Turn Visual Brief into implementation-ready HTML scene instructions.

**Deliverables:**

- `html-scene-brief.schema.json`
- DOM regions, interaction model, state variables, content visibility rules.
- One HTML Scene Brief for the public terminal / tax notice scene.

**Acceptance:**

- Brief can be implemented without rereading the whole chapter.
- Interactions include `requires` and `effects`.
- Reader-safe policy is explicit.

## 10. Phase 6 - First Playable Prototype

**Goal:** Build a small static HTML prototype for one scene.

**Deliverables:**

- Prototype under `03_SCENE_PIPELINE/prototypes/ch001-terminal/`.
- Static HTML/CSS/JS.
- Screenshot or browser QA notes.

**Acceptance:**

- Prototype opens locally.
- It shows only chapter 1-safe content.
- It uses the HTML Scene Brief as source, not the raw chapter directly.
- It has at least one meaningful interaction tied to an `interactionSeed`.

## 11. Phase 7 - Regeneration And Staleness

**Goal:** Make the system robust to novel edits.

**Deliverables:**

- Source hash check.
- Stale report for changed chapters.
- Regeneration policy.

**Acceptance:**

- Changing chapter 1 marks `ch001.json` stale.
- Validation can tell which downstream Visual Brief / HTML Brief / prototype may need regeneration.

## 12. Phase 8 - Authoring Workflow

**Goal:** Make the pipeline useful in everyday novel work.

**Deliverables:**

- Command list for generating cards.
- Review checklist.
- Guidance for when to update Scene Cards after chapter edits.

**Acceptance:**

- An AI agent can run the pipeline from root without touching novel prose.
- A human can review a card and see exactly where each claim came from.

## 13. Immediate Next Step

Create an implementation plan for Phase 1:

```text
docs/superpowers/plans/2026-06-14-novel-to-scene-phase-1.md
```

That plan should break Phase 1 into small commits:

1. Create schema.
2. Add schema validation helper.
3. Manually seed chapter 1 Scene Card.
4. Add validation report.
5. Add stale hash check.

Do not start Phase 2 until Phase 1 has a valid card and report.
