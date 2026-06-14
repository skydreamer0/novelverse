# Novel-to-Scene Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 MVP: one valid evidence-backed `chapter_scene_card` for chapter 1.

**Architecture:** Keep the pipeline at root and treat `novel/` as read-only reference input. Phase 1 creates a JSON Schema, a small validation script, one manually curated `ch001.json`, and a validation report. The script should validate schema shape, evidence coverage, forbidden terms, archive-source bans, and source-hash staleness.

**Tech Stack:** Node.js ES modules, JSON Schema via Ajv, root-level JSON artifacts under `03_SCENE_PIPELINE/`, UTF-8 text files.

---

## References

- Spec: `docs/superpowers/specs/2026-06-14-novel-to-scene-extraction-design.md`
- Roadmap: `docs/roadmaps/2026-06-14-novel-to-scene-roadmap.md`
- Root rules: `AGENTS.md`
- Source chapter: `novel/01_NOVEL_CONTENT/01_第一卷_艙底種火/第01章_欠稅通知.md`
- Supporting volume file: `novel/02_PROJECT_DATABASE/VOLUMES/vol01.md`

## File Structure

Create these root-level files:

```text
03_SCENE_PIPELINE/
  schemas/
    chapter-scene-card.schema.json
  scene-cards/
    ch001.json
  reports/
    ch001-validation.md
  tools/
    validate-scene-card.mjs
  package.json
```

Responsibilities:

- `chapter-scene-card.schema.json`: structural contract for `chapter_scene_card`.
- `ch001.json`: manually curated card for chapter 1, with evidence-first claims.
- `ch001-validation.md`: human-readable validation output and review notes.
- `validate-scene-card.mjs`: deterministic validator for one scene card.
- `package.json`: local pipeline scripts and dependencies, isolated from `novel/`.

Do not create or modify files inside `novel/`.

## Task 1: Create Pipeline Package Shell

**Files:**
- Create: `03_SCENE_PIPELINE/package.json`
- Create: `03_SCENE_PIPELINE/tools/validate-scene-card.mjs`

- [ ] **Step 1: Create package skeleton**

Add:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "validate:card": "node tools/validate-scene-card.mjs scene-cards/ch001.json"
  },
  "dependencies": {
    "ajv": "^8.17.1"
  }
}
```

- [ ] **Step 2: Add placeholder validator**

Create `03_SCENE_PIPELINE/tools/validate-scene-card.mjs`:

```js
import { readFile } from "node:fs/promises";

const cardPath = process.argv[2];

if (!cardPath) {
  console.error("Usage: node tools/validate-scene-card.mjs <card.json>");
  process.exit(2);
}

await readFile(cardPath, "utf8");
console.log(`Loaded ${cardPath}`);
```

- [ ] **Step 3: Install dependencies**

Run from `03_SCENE_PIPELINE/`:

```bash
npm install
```

Expected: `package-lock.json` is created and Ajv is installed.

- [ ] **Step 4: Verify placeholder fails without card**

Run from `03_SCENE_PIPELINE/`:

```bash
npm run validate:card
```

Expected: FAIL with file-not-found for `scene-cards/ch001.json`.

- [ ] **Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/package.json 03_SCENE_PIPELINE/package-lock.json 03_SCENE_PIPELINE/tools/validate-scene-card.mjs
git commit -m "chore: add scene pipeline package shell"
```

## Task 2: Add Chapter Scene Card Schema

**Files:**
- Create: `03_SCENE_PIPELINE/schemas/chapter-scene-card.schema.json`
- Modify: `03_SCENE_PIPELINE/tools/validate-scene-card.mjs`

- [ ] **Step 1: Write schema**

Create `chapter-scene-card.schema.json` with required top-level fields:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://novelverse.local/schemas/chapter-scene-card.schema.json",
  "type": "object",
  "required": [
    "schemaVersion",
    "cardType",
    "chapter",
    "title",
    "sourcePath",
    "sourceHash",
    "storyTime",
    "primaryViewpoint",
    "locations",
    "characters",
    "objects",
    "institutions",
    "sceneBeats",
    "spatialPredicates",
    "visualBriefSeeds",
    "interactionSeeds",
    "internalCandidates",
    "spoilerPolicy",
    "evidence"
  ],
  "properties": {
    "schemaVersion": { "const": "novel-scene-card.v1" },
    "cardType": { "const": "chapter_scene_card" },
    "chapter": { "type": "integer", "minimum": 1 },
    "title": { "type": "string", "minLength": 1 },
    "sourcePath": { "type": "string", "minLength": 1 },
    "sourceHash": { "type": "string", "pattern": "^sha256-[a-f0-9]{64}$" },
    "storyTime": { "type": "string", "minLength": 1 },
    "primaryViewpoint": { "type": "string", "minLength": 1 },
    "locations": { "$ref": "#/$defs/entityList" },
    "characters": { "$ref": "#/$defs/entityList" },
    "objects": { "$ref": "#/$defs/entityList" },
    "institutions": { "$ref": "#/$defs/entityList" },
    "sceneBeats": {
      "type": "array",
      "minItems": 2,
      "maxItems": 5,
      "items": { "$ref": "#/$defs/sceneBeat" }
    },
    "spatialPredicates": {
      "type": "array",
      "items": { "$ref": "#/$defs/spatialPredicate" }
    },
    "visualBriefSeeds": { "type": "object" },
    "interactionSeeds": {
      "type": "array",
      "items": { "$ref": "#/$defs/interactionSeed" }
    },
    "internalCandidates": { "type": "array" },
    "spoilerPolicy": {
      "type": "object",
      "required": ["readerVisibleUntilChapter", "allowedCanonDepth"],
      "properties": {
        "readerVisibleUntilChapter": { "type": "integer", "minimum": 1 },
        "allowedCanonDepth": { "type": "string" }
      },
      "additionalProperties": false
    },
    "evidence": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/$defs/evidence" }
    },
    "warnings": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "additionalProperties": false,
  "$defs": {
    "entityList": {
      "type": "array",
      "items": { "$ref": "#/$defs/entity" }
    },
    "entity": {
      "type": "object",
      "required": ["id", "name", "role", "evidenceIds"],
      "properties": {
        "id": { "type": "string", "minLength": 1 },
        "name": { "type": "string", "minLength": 1 },
        "role": { "type": "string", "minLength": 1 },
        "evidenceIds": {
          "type": "array",
          "minItems": 1,
          "items": { "type": "string" }
        },
        "canonSupport": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "additionalProperties": false
    },
    "sceneBeat": {
      "type": "object",
      "required": ["id", "title", "startCue", "endCue", "locationId", "activeCharacterIds", "actionSummary", "evidenceIds"],
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "startCue": { "type": "string" },
        "endCue": { "type": "string" },
        "locationId": { "type": "string" },
        "activeCharacterIds": {
          "type": "array",
          "items": { "type": "string" }
        },
        "actionSummary": { "type": "string" },
        "evidenceIds": {
          "type": "array",
          "minItems": 1,
          "items": { "type": "string" }
        }
      },
      "additionalProperties": false
    },
    "spatialPredicate": {
      "type": "object",
      "required": ["id", "subject", "relation", "object", "evidenceIds"],
      "properties": {
        "id": { "type": "string" },
        "subject": { "type": "string" },
        "relation": { "type": "string" },
        "object": { "type": "string" },
        "evidenceIds": {
          "type": "array",
          "minItems": 1,
          "items": { "type": "string" }
        }
      },
      "additionalProperties": false
    },
    "interactionSeed": {
      "type": "object",
      "required": ["id", "label", "target", "requires", "effects", "evidenceIds"],
      "properties": {
        "id": { "type": "string" },
        "label": { "type": "string" },
        "target": { "type": "string" },
        "requires": {
          "type": "array",
          "items": { "type": "string" }
        },
        "effects": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "required": ["state", "change"],
            "properties": {
              "state": { "type": "string" },
              "change": { "type": "string" }
            },
            "additionalProperties": false
          }
        },
        "evidenceIds": {
          "type": "array",
          "minItems": 1,
          "items": { "type": "string" }
        }
      },
      "additionalProperties": false
    },
    "evidence": {
      "type": "object",
      "required": ["id", "sourcePath", "locator", "quote", "supports", "confidence"],
      "properties": {
        "id": { "type": "string" },
        "sourcePath": { "type": "string" },
        "locator": {
          "type": "object",
          "required": ["type", "anchor"],
          "properties": {
            "type": { "const": "text-anchor" },
            "anchor": { "type": "string", "minLength": 1 }
          },
          "additionalProperties": false
        },
        "quote": { "type": "string", "minLength": 1 },
        "supports": {
          "type": "array",
          "minItems": 1,
          "items": { "type": "string" }
        },
        "confidence": { "enum": ["high", "medium", "low"] }
      },
      "additionalProperties": false
    }
  }
}
```

- [ ] **Step 2: Wire Ajv schema validation**

Update `validate-scene-card.mjs` to:

1. Resolve paths from `03_SCENE_PIPELINE/`.
2. Load `schemas/chapter-scene-card.schema.json`.
3. Parse the target card.
4. Validate with Ajv.
5. Print schema errors and exit `1` on failure.

- [ ] **Step 3: Run validator with missing card**

Run:

```bash
cd 03_SCENE_PIPELINE
npm run validate:card
```

Expected: still FAIL because `ch001.json` does not exist.

- [ ] **Step 4: Commit**

```bash
git add 03_SCENE_PIPELINE/schemas/chapter-scene-card.schema.json 03_SCENE_PIPELINE/tools/validate-scene-card.mjs
git commit -m "feat: add chapter scene card schema"
```

## Task 3: Add Source Hash And Evidence Validator Rules

**Files:**
- Modify: `03_SCENE_PIPELINE/tools/validate-scene-card.mjs`

- [ ] **Step 1: Add source hash calculation**

Use Node crypto:

```js
import { createHash } from "node:crypto";

function sha256(text) {
  return `sha256-${createHash("sha256").update(text, "utf8").digest("hex")}`;
}
```

Read `card.sourcePath` from root-relative path `../${card.sourcePath}` when running from `03_SCENE_PIPELINE/`.

- [ ] **Step 2: Add custom checks**

Validator must fail if:

- `card.sourceHash` does not match current source file hash.
- Any `evidence[].sourcePath` contains `/04_ARCHIVE/`.
- Any `evidence[].locator.anchor` is not found in its source file.
- Any `evidence[].quote` is not found in its source file.
- Any entity, sceneBeat, spatialPredicate, or interactionSeed references an unknown evidence id.
- Any reader-safe string contains forbidden terms:
  - `伏筆`
  - `後續揭露`
  - `V7 才揭露`
  - `作者需注意`
  - `AI 續寫`
  - `設定上`

- [ ] **Step 3: Add success output**

On success, print:

```text
Scene card validation passed: scene-cards/ch001.json
Evidence count: N
Source hash: sha256-...
```

- [ ] **Step 4: Commit**

```bash
git add 03_SCENE_PIPELINE/tools/validate-scene-card.mjs
git commit -m "feat: add scene card evidence validation"
```

## Task 4: Manually Seed Chapter 1 Scene Card

**Files:**
- Create: `03_SCENE_PIPELINE/scene-cards/ch001.json`

- [ ] **Step 1: Compute source hash**

Run from root:

```bash
python3 - <<'PY'
from pathlib import Path
from hashlib import sha256
p = Path('novel/01_NOVEL_CONTENT/01_第一卷_艙底種火/第01章_欠稅通知.md')
text = p.read_text(encoding='utf-8-sig')
print('sha256-' + sha256(text.encode('utf-8')).hexdigest())
PY
```

Use this hash in `ch001.json`.

- [ ] **Step 2: Create evidence-first card**

Seed `ch001.json` with:

- `schemaVersion`: `novel-scene-card.v1`
- `cardType`: `chapter_scene_card`
- `chapter`: `1`
- `title`: `欠稅通知`
- `sourcePath`: `novel/01_NOVEL_CONTENT/01_第一卷_艙底種火/第01章_欠稅通知.md`
- `storyTime`: `七十二小時清退倒數開始`
- `primaryViewpoint`: `林燼`

Minimum required entities:

- locations:
  - `loc-d9-maintenance`
  - `loc-public-terminal`
  - `loc-black-market`
  - `loc-seventh-deployment-belt`
- characters:
  - `char-lin-jin`
  - `char-foreman-cheng`
  - `char-su-lan`
  - `char-he-tie`
- objects:
  - `obj-wrench`
  - `obj-wristband`
  - `obj-public-terminal`
  - `obj-mission-chip`
  - `obj-gray-blue-inhibitor`
  - `obj-prosthetic-leg`
- institutions:
  - `inst-audit-bureau`
  - `inst-dog-knife-gang`
  - `inst-black-market`

Minimum required scene beats:

- `beat-maintenance-oxygen-repair`
- `beat-public-terminal-tax-notice`
- `beat-black-market-mission-chip`
- `beat-seventh-deployment-belt-entry`

Minimum required spatial predicates:

- `lin-jin inside/behind maintenance power slot`
- `public terminal displays tax red text`
- `su-lan behind bar gives mission chip`
- `black market wall contains recycled organ jars`

Minimum required interaction seeds:

- `int-check-tax-notice`
- `int-inspect-wristband`
- `int-accept-mission-chip`
- `int-review-fracture-note`

- [ ] **Step 3: Keep quotes short**

Use short evidence quotes only. Do not copy large paragraphs from the novel into JSON.

- [ ] **Step 4: Run validation**

Run:

```bash
cd 03_SCENE_PIPELINE
npm run validate:card
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/scene-cards/ch001.json
git commit -m "data: add chapter 1 scene card"
```

## Task 5: Add Validation Report

**Files:**
- Create: `03_SCENE_PIPELINE/reports/ch001-validation.md`

- [ ] **Step 1: Write report**

Include:

```markdown
# Chapter 1 Scene Card Validation

## Source

- Source path:
- Source hash:
- Card path:

## Validation

- Schema validation:
- Source hash:
- Evidence anchors:
- Evidence quotes:
- Archive source ban:
- Forbidden terms:
- Evidence coverage:

## Human Review Notes

- Reader-safe status:
- Known limitations:
- Suggested Phase 2 watch points:
```

- [ ] **Step 2: Run validator again**

Run:

```bash
cd 03_SCENE_PIPELINE
npm run validate:card
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add 03_SCENE_PIPELINE/reports/ch001-validation.md
git commit -m "docs: add chapter 1 scene card validation report"
```

## Task 6: Add Root Workflow Notes

**Files:**
- Modify: `docs/roadmaps/2026-06-14-novel-to-scene-roadmap.md`
- Modify: `AGENTS.md` if needed

- [ ] **Step 1: Add Phase 1 command note to roadmap**

Add the validation command under Phase 1 after implementation:

```bash
cd 03_SCENE_PIPELINE
npm run validate:card
```

- [ ] **Step 2: Add no-edit reminder if missing**

Confirm `AGENTS.md` still says not to edit novel prose while working on pipeline artifacts.

- [ ] **Step 3: Final verification**

Run:

```bash
cd 03_SCENE_PIPELINE
npm run validate:card
cd ..
python3 - <<'PY'
from pathlib import Path
for p in [
    Path('03_SCENE_PIPELINE/schemas/chapter-scene-card.schema.json'),
    Path('03_SCENE_PIPELINE/scene-cards/ch001.json'),
    Path('03_SCENE_PIPELINE/reports/ch001-validation.md'),
    Path('03_SCENE_PIPELINE/tools/validate-scene-card.mjs'),
]:
    data = p.read_bytes()
    assert not data.startswith(b'\xef\xbb\xbf'), p
    data.decode('utf-8')
print('UTF-8 OK')
PY
git status --short
```

Expected:

- Validator passes.
- UTF-8 check passes.
- Git status shows only expected root changes before commit.
- `novel/` nested repo has no changes from this work.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md docs/roadmaps/2026-06-14-novel-to-scene-roadmap.md
git commit -m "docs: document scene card validation workflow"
```

## Completion Criteria

Phase 1 is complete only when:

- `npm run validate:card` passes from `03_SCENE_PIPELINE/`.
- `ch001.json` exists and validates.
- `ch001-validation.md` records the validation results.
- `sourceHash` matches the current chapter 1 source file.
- No files inside `novel/` were modified.
- All Phase 1 commits are in root git history.

## After Phase 1

Do not start Phase 2 automatically. Ask the user to review:

- `03_SCENE_PIPELINE/scene-cards/ch001.json`
- `03_SCENE_PIPELINE/reports/ch001-validation.md`

Then decide whether to:

1. revise the schema,
2. revise the card,
3. continue to chapters 1-5 batch extraction.
