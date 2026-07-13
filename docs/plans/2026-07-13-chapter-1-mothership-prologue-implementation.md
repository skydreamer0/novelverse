# Chapter 1 Mothership Prologue Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic fragment-collection prototype with a first-person, chapter-ordered playable prologue that builds from a claustrophobic maintenance bay to a large-scale mothership exterior reveal.

**Architecture:** Keep the Vite/Three.js prototype dependency-light. Separate deterministic story and survival state from rendering so Node's built-in test runner can cover progression, then let a director coordinate procedural Three.js environment modules and a diegetic HTML interface. Use generated geometry and fallback materials for the vertical slice so missing authored assets never block the full chapter flow.

**Tech Stack:** Three.js 0.160, Vite 5, JavaScript ES modules, Node `node:test`, HTML/CSS, Web Audio API

---

### Task 1: Add deterministic prologue state tests

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/core/PrologueState.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/PrologueState.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/package.json`

**Step 1: Add the failing state tests**

Test these requirements with `node:test` and `node:assert/strict`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PrologueState, BEATS } from '../src/core/PrologueState.js';

test('starts in maintenance with chapter-safe survival values', () => {
  const state = new PrologueState();
  assert.equal(state.beat, BEATS.MAINTENANCE);
  assert.equal(state.oxygen, 100);
  assert.equal(state.debt, 0);
  assert.equal(state.deadlineHours, null);
});

test('repair steps must be completed in order', () => {
  const state = new PrologueState();
  assert.equal(state.apply('pull-valve').ok, false);
  state.apply('locate-short');
  state.apply('secure-joint');
  assert.equal(state.apply('pull-valve').ok, true);
  assert.equal(state.beat, BEATS.TERMINAL);
});

test('terminal scan establishes the chapter threat', () => {
  const state = new PrologueState();
  state.apply('debug-skip-maintenance');
  state.apply('scan-wristband');
  assert.equal(state.debt, 40);
  assert.equal(state.deadlineHours, 72);
  assert.equal(state.beat, BEATS.BLACK_MARKET);
});

test('black-market choice preserves mandatory mission acceptance', () => {
  const state = new PrologueState();
  state.apply('debug-skip-black-market');
  state.apply('choose-bargain', { choice: 'intel' });
  assert.equal(state.missionAccepted, true);
  assert.equal(state.blackMarketBenefit, 'intel');
  assert.equal(state.beat, BEATS.DEPLOYMENT);
});
```

**Step 2: Run tests and verify failure**

Run: `npm test` from `03_SCENE_PIPELINE/3d-prototype/`  
Expected: FAIL because the state module and/or test script does not exist.

**Step 3: Implement the minimal state machine**

Export frozen beat identifiers, initialize reader-safe chapter state, validate event order, apply small oxygen/leg-load consequences, and provide `snapshot()` plus a change subscription API. Debug skip events must exist only when `import.meta.env` is not production or when called directly by tests.

**Step 4: Run tests**

Run: `npm test`  
Expected: all state tests PASS.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/package.json 03_SCENE_PIPELINE/3d-prototype/src/core/PrologueState.js 03_SCENE_PIPELINE/3d-prototype/test/PrologueState.test.js
git commit -m "test: define chapter 1 prologue progression"
```

### Task 2: Replace third-person movement with first-person controls and gaze interaction

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/core/FirstPersonController.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/src/core/InteractionSystem.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/InteractionSystem.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/main.js`

**Step 1: Write failing interaction-selection tests**

Cover nearest valid target selection, distance rejection, disabled targets, and deterministic priority ties. Keep the pure candidate-ranking function independent of DOM and Three.js raycasting.

**Step 2: Run tests and verify failure**

Run: `npm test`  
Expected: FAIL because `InteractionSystem.js` is absent.

**Step 3: Implement interaction ranking and first-person controls**

The controller owns WASD motion, pointer-lock yaw/pitch, collision bounds, walk bob and leg-load limp. The interaction system casts from screen center, requires line of sight, shows only one prompt, and emits the target's semantic action on `E`.

**Step 4: Remove runtime use of old third-person modules**

Stop importing `Player`, `PlayerAvatar`, `ThirdPersonCamera`, `GameManager`, and `Enemies` from `main.js`. Leave files temporarily for a later cleanup commit so rollback stays easy.

**Step 5: Verify**

Run: `npm test && npm run build`  
Expected: tests PASS and Vite build succeeds.

**Step 6: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/core 03_SCENE_PIPELINE/3d-prototype/test 03_SCENE_PIPELINE/3d-prototype/src/main.js
git commit -m "feat: add first-person gaze interaction"
```

### Task 3: Build the procedural mothership interior kit

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/world/materials.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/src/world/MothershipWorld.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/src/world/buildMaintenanceBay.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/src/world/buildTerminalCorridor.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/src/world/buildBlackMarket.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/src/world/buildDeploymentBelt.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/WorldManifest.test.js`

**Step 1: Write a failing world-manifest test**

Test a pure exported manifest for unique scene ids, ordered beats, required interaction actions, and required mothership identity cues: curved hull, life-support pipes, maintenance abyss, airlock, hull exterior, navigation lights, and fracture.

**Step 2: Run tests and verify failure**

Run: `npm test`  
Expected: FAIL because the world module is absent.

**Step 3: Implement shared materials and geometry helpers**

Create damp rusted metal, painted hull, emissive status light, glass, tax-seal paper, fracture-dark, and hologram materials. Reuse geometries and materials; use instancing for pipe clamps, lights, seals, crowd silhouettes, and distant hull lights.

**Step 4: Implement the four ordered environment zones**

- Maintenance: curved shell ribs, pipe jungle, power slot, red/yellow/green lights, grated maintenance abyss.
- Terminal: repeating curved corridor, failed light tubes, damp wall, layered tax seals, resident silhouettes, physical public terminal.
- Black market: abandoned pressure chamber, bar, purple LEDs, glass jars, fan and Su Lan proxy silhouette.
- Deployment: airlock, patched carrier, team proxies, exterior grated belt, giant curved hull, distant navigation lights, sparse stars and fracture.

Each builder returns roots, colliders, interactables and animation handles. Place zones along a controlled path and gate unreached areas with believable pressure doors.

**Step 5: Add ambient world motion**

Implement low-amplitude hull vibration, cascading power flicker, condensation drops, drifting maintenance dust, airlock pressure fog, slow star drift and fracture edge pulse. Avoid expensive volumetric raymarching in the first slice.

**Step 6: Verify**

Run: `npm test && npm run build`  
Expected: tests PASS and build succeeds without missing asset errors.

**Step 7: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/world 03_SCENE_PIPELINE/3d-prototype/test/WorldManifest.test.js
git commit -m "feat: build procedural mothership chapter zones"
```

### Task 4: Connect chapter direction and environmental transitions

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/core/PrologueDirector.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/PrologueDirector.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/main.js`

**Step 1: Write failing director tests**

Use fake world and UI adapters to verify that state changes unlock the next door, focus the correct terminal content, open the exterior airlock only after mission acceptance, and end only after `enter-fracture`.

**Step 2: Run tests and verify failure**

Run: `npm test`  
Expected: FAIL because the director does not exist.

**Step 3: Implement the director**

Map semantic actions to state events. Drive repair feedback, terminal scan sequence, black-market choice, deployment briefing, airlock reveal and chapter-end transition. Keep timing cancellable and prevent duplicate action dispatch.

**Step 4: Wire the runtime composition root**

`main.js` constructs renderer, state, world, first-person controller, interaction system, UI, audio and director; the animation loop updates each module in a stable order and clamps large delta times after tab suspension.

**Step 5: Verify**

Run: `npm test && npm run build`  
Expected: all tests PASS and production bundle builds.

**Step 6: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/core/PrologueDirector.js 03_SCENE_PIPELINE/3d-prototype/test/PrologueDirector.test.js 03_SCENE_PIPELINE/3d-prototype/src/main.js
git commit -m "feat: direct chapter 1 playable sequence"
```

### Task 5: Replace generic HUD with a diegetic interface

**Files:**
- Rewrite: `03_SCENE_PIPELINE/3d-prototype/index.html`
- Rewrite: `03_SCENE_PIPELINE/3d-prototype/style.css`
- Rewrite: `03_SCENE_PIPELINE/3d-prototype/src/UIManager.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/ReaderSafeCopy.test.js`

**Step 1: Write a failing reader-safe copy test**

Load exported UI copy and assert it contains only chapter 1 values, includes D9-4417, 27, 9, 40 and 72 hours, and excludes old fragment/pollution wording plus internal process terms.

**Step 2: Run tests and verify failure**

Run: `npm test`  
Expected: FAIL against the current generic HUD.

**Step 3: Implement the interface**

Create a restrained start screen, central interaction reticle, contextual action prompt, subtitles, an animated worn-wristband panel, physical-terminal overlay, three-choice black-market negotiation, pause/accessibility panel and chapter-end screen. No permanent mission panel or conventional health bar.

**Step 4: Style the chapter visual system**

Use oxidized graphite, oxygen amber, audit red, terminal cyan and fracture blue-white. Typography should feel industrial and bureaucratic, with restrained scanlines and damaged edges. Support responsive desktop layouts, reduced motion, high contrast and keyboard focus states.

**Step 5: Verify**

Run: `npm test && npm run build`  
Expected: tests PASS and bundle builds.

**Step 6: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/index.html 03_SCENE_PIPELINE/3d-prototype/style.css 03_SCENE_PIPELINE/3d-prototype/src/UIManager.js 03_SCENE_PIPELINE/3d-prototype/test/ReaderSafeCopy.test.js
git commit -m "feat: add diegetic chapter 1 interface"
```

### Task 6: Add procedural mothership audio and quality controls

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/core/AudioDirector.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/src/core/QualityManager.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/main.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/UIManager.js`

**Step 1: Implement audio after user activation**

Use Web Audio oscillators, filtered noise and gain automation for hull groan, pump hum, breathing, welding, terminal chirps, airlock pressure and fracture whine. Start only after a user gesture and expose mute/volume controls.

**Step 2: Implement quality tiers**

Choose high/medium/low settings based on renderer capability and measured frame time. Scale pixel ratio, shadow map, particle counts and dynamic lights without changing gameplay.

**Step 3: Verify graceful fallback**

Run with audio disabled and with a forced low-quality query flag. Confirm the full chapter remains playable and the console has no uncaught errors.

**Step 4: Verify build**

Run: `npm test && npm run build`  
Expected: tests PASS and build succeeds.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/core 03_SCENE_PIPELINE/3d-prototype/src/main.js 03_SCENE_PIPELINE/3d-prototype/src/UIManager.js
git commit -m "feat: add mothership audio and quality scaling"
```

### Task 7: Remove obsolete prototype code and perform browser QA

**Files:**
- Delete: `03_SCENE_PIPELINE/3d-prototype/src/Enemies.js`
- Delete: `03_SCENE_PIPELINE/3d-prototype/src/GameManager.js`
- Delete: `03_SCENE_PIPELINE/3d-prototype/src/Player.js`
- Delete: `03_SCENE_PIPELINE/3d-prototype/src/PlayerAvatar.js`
- Delete: `03_SCENE_PIPELINE/3d-prototype/src/ThirdPersonCamera.js`
- Delete: `03_SCENE_PIPELINE/3d-prototype/src/World.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/QA.md`

**Step 1: Prove obsolete imports are gone**

Run: `rg "Enemies|GameManager|PlayerAvatar|ThirdPersonCamera|from './World'" 03_SCENE_PIPELINE/3d-prototype/src`  
Expected: no matches.

**Step 2: Delete the obsolete modules**

Remove only the now-unreferenced generic fragment/pollution prototype code.

**Step 3: Run automated verification**

Run: `npm test && npm run build`  
Expected: all tests PASS; Vite production build succeeds.

**Step 4: Run browser QA**

Start Vite and verify at desktop and narrow viewport:

- Start overlay and pointer lock recovery.
- Ordered maintenance interactions.
- Terminal displays exact chapter 1 debt values.
- One black-market benefit can be selected and mission still proceeds.
- Airlock reveal clearly shows curved hull, depth and space.
- Fracture entry reaches the chapter-end screen.
- No fragment counter, pollution bar or red chasing cubes remain.
- Reduced-motion and high-contrast controls remain usable.

Record observations, screenshots paths if created, browser, viewport and any accepted limitations in `QA.md`.

**Step 5: Verify encoding and repository scope**

Confirm changed Traditional Chinese text files decode as UTF-8 and do not start with a BOM. Confirm `novel/` has no modifications.

**Step 6: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype
git commit -m "refactor: retire generic collection prototype"
```

## Completion Criteria

- `npm test` passes.
- `npm run build` passes.
- Browser QA completes the chapter from repair to fracture entry.
- The current generic fragment collection, pollution bar and chasing placeholders are absent.
- The exterior reveal communicates mothership scale without relying on explanatory text.
- No file under `novel/` is modified.
- Traditional Chinese text is UTF-8 without BOM.

