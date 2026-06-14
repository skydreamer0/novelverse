# Novelverse - Novel-to-Scene Pipeline

Novelverse is the orchestrating workspace for the **Novel-to-Scene** pipeline. This pipeline systematically converts chapters of a novel into evidence-backed, visualizable, and interactive/playable HTML scene prototypes.

The core philosophy of this project is to stay strictly loyal to the source novel. Instead of generating scenes through a single, freeform AI prompt, we use a deterministic, multi-stage extraction pipeline with strict schema validation and reader-safe projections.

---

## 📂 Repository Structure

The workspace is structured to separate source references, pipeline definitions, and build artifacts:

```text
novelverse/
├── README.md               # This project introduction and guide
├── AGENTS.md               # Root Agent Instructions (workspace boundaries & rules)
├── .gitignore              # Standard ignore configurations
├── .gitmodules             # Submodule metadata linking the novel subrepository
├── docs/                   # Root-level pipeline documentation
│   ├── roadmaps/           # Roadmap logs and timeline records
│   └── superpowers/        # Superpower specifications and implementation plans
│       ├── specs/
│       └── plans/
├── novel/                  # [GIT SUBMODULE] Mutable source reference repository
│                           # containing the novel text, reader app, and canon databases.
└── 03_SCENE_PIPELINE/      # Future home of generated scene cards and prototypes
    ├── schemas/            # JSON Schemas for validation
    ├── scene-cards/        # Validated chapter and scene-level metadata cards
    ├── reports/            # Validation reports (hash tracking & lint checks)
    ├── visual-briefs/      # Visual generation briefs
    ├── html-scene-briefs/  # DOM layouts and interaction schemas
    └── prototypes/         # Playable HTML/JS/CSS scene modules
```

---

## 🔄 The Novel-to-Scene Pipeline

The pipeline operates in a sequence of structured stages:

```
Novel Chapter Text ──> Evidence Pass ──> Scene Card (JSON) ──> Visual Brief ──> HTML Scene Brief ──> Playable Scene
```

1. **Novel Chapter Text**: The source of truth (found under `novel/01_NOVEL_CONTENT/`).
2. **Evidence Pass**: Extraction of exact textual sentences supporting facts, entities, beats, and relations.
3. **Scene Card (JSON)**: Structured JSON representation of characters, locations, objects, and temporal beats, validated against schemas.
4. **Visual Brief**: Aesthetic definitions (palette, lighting, layouts, props) mapping directly to textual evidence.
5. **HTML Scene Brief**: Technical specifications of DOM structure, state variables, visibility rules, and user interaction logic.
6. **Playable Scene**: A modular, interactive HTML/CSS/JS frontend module representing the story beat.

---

## 🛠️ Getting Started

### Cloning the Project
Since this project uses git submodules to track the novel source reference, clone this repository recursively:

```bash
git clone --recursive https://github.com/skydreamer0/novelverse.git
```

If you have already cloned the repository without submodules, run:

```bash
git submodule update --init --recursive
```

### Working with Submodules
The `novel/` subdirectory is tracked as a Git submodule referencing `https://github.com/skydreamer0/novel_ark-micro-civ.git`. 
- **Important**: Do not commit changes to the `novel/` subrepository from the root repository directly. All novel prose edits, reader app changes, and canon updates must be committed and pushed inside the `novel/` directory.

---

## ⚠️ Key Operating Rules for Contributors & AI Agents

Please consult `AGENTS.md` and `novel/AGENTS.md` for full compliance guidelines.

1. **Mutable Reference Source**: `novel/` is a reference-only source. Never place new Novel-to-Scene specs, plans, schemas, or generated pipeline artifacts inside `novel/` unless explicitly requested.
2. **Encoding**: All Traditional Chinese text files must be encoded in **UTF-8 without BOM** to avoid mojibake. Never use PowerShell `>` or `Out-File` redirection on Chinese files.
3. **Reader-Safe Policy**: Generated scene outputs must not leak future chapter events, author notes, or AI process language to the player/reader.
4. **Evidence-First**: Every material scene claim, spatial layout, or entity description must carry explicit evidence or remain an internal candidate.
