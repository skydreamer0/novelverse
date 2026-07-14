# Maintenance Challenge and Mothership Scale Reveal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the chapter 1 maintenance bay into a skill-based, recoverable 3–5 minute interaction and make the exterior reveal a layered mothership-scale payoff that visibly echoes the repaired D9 power circuit.

**Architecture:** Add two deterministic, renderer-independent state machines: `MaintenanceChallenge` for repair pressure and `ScaleRevealDirector` for the airlock reveal timeline. Keep `PrologueState` authoritative for chapter order and persistent survival values; adapters in `PrologueDirector`, `MothershipWorld`, `UIManager`, and `AudioDirector` translate state snapshots into controls, geometry, sound, and reader-safe feedback.

**Tech Stack:** Three.js 0.160, Vite 5, JavaScript ES modules, Node `node:test`, HTML/CSS, Web Audio API, GLSL `ShaderMaterial`

---

### Task 1: Define the deterministic maintenance challenge

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/core/MaintenanceChallenge.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/MaintenanceChallenge.test.js`

**Step 1: Write the failing state tests**

Cover the distinct interaction phases, time pressure, soft failure, assistance, and completion result:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { MaintenanceChallenge, MAINTENANCE_PHASES } from '../src/core/MaintenanceChallenge.js';

test('wrong cable causes a recoverable breaker trip', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  const result = challenge.probeCable('cable-a');
  assert.equal(result.ok, false);
  assert.equal(result.softFailure, 'wrong-cable');
  assert.equal(challenge.phase, MAINTENANCE_PHASES.LOCATE);
  assert.equal(challenge.failureCount, 1);
  assert.ok(challenge.oxygen < 100);
});

test('correct cable advances to a sustained weld', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  assert.equal(challenge.probeCable('cable-c').ok, true);
  assert.equal(challenge.phase, MAINTENANCE_PHASES.WELD);
  for (let i = 0; i < 160; i += 1) {
    challenge.update(0.1, { engaged: true, alignment: challenge.weldTarget });
  }
  assert.equal(challenge.phase, MAINTENANCE_PHASES.VALVE);
});

test('overheat resets only weld progress and unlocks assistance', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  challenge.probeCable('cable-c');
  for (let failure = 0; failure < 2; failure += 1) {
    challenge.update(3, { engaged: true, alignment: 1 });
  }
  assert.equal(challenge.phase, MAINTENANCE_PHASES.WELD);
  assert.ok(challenge.assistLevel > 0);
  assert.ok(challenge.weldProgress < 1);
});

test('braced valve work completes with a graded result', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  challenge.debugAdvanceToValve();
  for (let i = 0; i < 240 && !challenge.complete; i += 1) {
    challenge.update(0.1, { pulling: true, braced: true });
  }
  const snapshot = challenge.snapshot();
  assert.equal(snapshot.phase, MAINTENANCE_PHASES.COMPLETE);
  assert.ok(snapshot.repairQuality >= 1 && snapshot.repairQuality <= 100);
  assert.ok(snapshot.elapsed > 0);
});
```

**Step 2: Run the test to verify it fails**

Run: `npm test -- test/MaintenanceChallenge.test.js`  
Expected: FAIL because `MaintenanceChallenge.js` does not exist.

**Step 3: Implement the pure state machine**

Export frozen phases `locate`, `weld`, `valve`, `complete`. Use clamped numeric state for oxygen, leg load, weld heat/progress, valve progress, elapsed time, failure count, assist level, and repair quality. Requirements:

- `probeCable(id)` never leaves `locate` on a wrong cable.
- `update(delta, input)` clamps `delta` to `0.1` and ignores invalid numbers.
- Oxygen decays while the challenge is active, but bottoms at a playable reserve rather than killing the player.
- Welding progresses only while engaged and inside the assisted safe window; overheating emits a breaker-trip result and resets only unstable weld progress.
- Pulling while unbraced during a resistance peak raises leg load and causes a recoverable slip.
- Assistance increases after repeated failures by widening the weld window and valve safe interval.
- `snapshot()` returns a frozen serializable object; no DOM, Three.js, or timers.

**Step 4: Run the focused and full tests**

Run: `npm test -- test/MaintenanceChallenge.test.js`  
Expected: maintenance tests PASS.  
Run: `npm test`  
Expected: all tests PASS.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/core/MaintenanceChallenge.js 03_SCENE_PIPELINE/3d-prototype/test/MaintenanceChallenge.test.js
git commit -m "feat: add maintenance challenge state"
```

### Task 2: Persist challenge results in chapter progression

**Files:**
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/core/PrologueState.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/core/PrologueDirector.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/PrologueState.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/PrologueDirector.test.js`

**Step 1: Replace the old instant-repair tests**

Test one semantic completion event rather than three instantaneous story events:

```js
test('maintenance result persists player performance and unlocks terminal', () => {
  const state = new PrologueState();
  const result = state.apply('complete-maintenance', {
    oxygen: 74,
    legLoad: 31,
    repairQuality: 82,
    failureCount: 2,
    elapsed: 196,
  });
  assert.equal(result.ok, true);
  assert.equal(state.beat, BEATS.TERMINAL);
  assert.equal(state.oxygen, 74);
  assert.equal(state.legLoad, 31);
  assert.equal(state.repairQuality, 82);
  assert.equal(state.maintenanceFailures, 2);
});
```

Also reject incomplete or out-of-range payloads and keep `debug-skip-maintenance` for QA only.

**Step 2: Run focused tests and verify failure**

Run: `npm test -- test/PrologueState.test.js test/PrologueDirector.test.js`  
Expected: FAIL because the new event and fields are absent.

**Step 3: Implement the chapter adapter**

- Add `maintenanceFailures` and `maintenanceElapsed` to `PrologueState` and `snapshot()`.
- Accept `complete-maintenance` only during `BEATS.MAINTENANCE` with a complete, finite payload.
- Remove runtime dependence on `locate-short`, `secure-joint`, and `pull-valve`; retain reader-safe subtitles in the maintenance feedback adapter rather than chapter state.
- Add `PrologueDirector.completeMaintenance(snapshot)` to apply the result, sync world/UI/controller, and emit `maintenance-complete` audio.
- Preserve all terminal, black-market, deployment, reveal, and completion behavior.

**Step 4: Verify**

Run: `npm test`  
Expected: all tests PASS.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/core/PrologueState.js 03_SCENE_PIPELINE/3d-prototype/src/core/PrologueDirector.js 03_SCENE_PIPELINE/3d-prototype/test/PrologueState.test.js 03_SCENE_PIPELINE/3d-prototype/test/PrologueDirector.test.js
git commit -m "refactor: persist maintenance results"
```

### Task 3: Add accessible repair controls and diegetic tool feedback

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/core/MaintenanceInput.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/MaintenanceInput.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/index.html`
- Modify: `03_SCENE_PIPELINE/3d-prototype/style.css`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/UIManager.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/ReaderSafeCopy.test.js`

**Step 1: Write failing input and copy tests**

Test a pure input mapper:

```js
import { mapMaintenanceKeys } from '../src/core/MaintenanceInput.js';

test('maps keyboard controls without requiring pointer precision', () => {
  assert.deepEqual(mapMaintenanceKeys(new Set(['KeyA', 'Space'])), {
    alignmentDelta: -1,
    engaged: true,
    pulling: true,
    braced: false,
  });
  assert.equal(mapMaintenanceKeys(new Set(['ShiftLeft'])).braced, true);
});
```

Extend copy tests to require chapter-safe labels for probe, weld heat, joint stability, brace, pressure, and breaker recovery.

**Step 2: Run focused tests and verify failure**

Run: `npm test -- test/MaintenanceInput.test.js test/ReaderSafeCopy.test.js`  
Expected: FAIL because the mapper and copy are absent.

**Step 3: Implement input and UI**

- `MaintenanceInput` owns a key set, alignment value, active phase, and `snapshot()`; use `A/D` or arrows to tune weld alignment, `Space` to engage/pull, and either Shift key to brace.
- Add a maintenance instrument panel with semantic progress elements for signal strength, heat, stability, pressure, oxygen, and current instruction.
- `UIManager.renderMaintenance(snapshot)` updates values, warning states, phase labels, and an `aria-live` status line.
- `UIManager.setMaintenanceActive(active)` controls the panel and hides the generic crosshair prompt while a sustained repair action is active.
- High-contrast mode must add shape/text cues; reduced-motion mode removes shake and flashing without removing state information.
- Keep the panel compact and world-adjacent; do not add a permanent quest list.

**Step 4: Verify**

Run: `npm test && npm run build`  
Expected: tests PASS and Vite build succeeds.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/core/MaintenanceInput.js 03_SCENE_PIPELINE/3d-prototype/test/MaintenanceInput.test.js 03_SCENE_PIPELINE/3d-prototype/index.html 03_SCENE_PIPELINE/3d-prototype/style.css 03_SCENE_PIPELINE/3d-prototype/src/UIManager.js 03_SCENE_PIPELINE/3d-prototype/test/ReaderSafeCopy.test.js
git commit -m "feat: add diegetic repair controls"
```

### Task 4: Rebuild the maintenance bay as a reactive workspace

**Files:**
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/world/buildMaintenanceBay.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/world/MothershipWorld.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/src/world/MaintenanceFeedback.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/WorldManifest.test.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/MaintenanceFeedback.test.js`

**Step 1: Write failing manifest and feedback tests**

Require three probe candidates, distinct sustained-action targets, a readable aisle, power-chain sections, pressure fog, and recoverable breaker states:

```js
test('maintenance bay exposes skill interaction and power-chain cues', () => {
  assert.equal(WORLD_MANIFEST.maintenance.cableCandidates, 3);
  assert.deepEqual(WORLD_MANIFEST.maintenance.phases, ['locate', 'weld', 'valve']);
  assert.ok(WORLD_MANIFEST.maintenance.powerChainSections >= 5);
  assert.ok(WORLD_MANIFEST.maintenance.softFailureCues.includes('breaker-blackout'));
});
```

Test a pure `deriveMaintenanceFeedback(previous, next)` mapper for wrong cable, overheat, valve slip, phase change, and completion.

**Step 2: Run focused tests and verify failure**

Run: `npm test -- test/WorldManifest.test.js test/MaintenanceFeedback.test.js`  
Expected: FAIL on missing manifest and mapper.

**Step 3: Build the reactive scene**

- Replace the single short sphere with three cable bundles, probe sockets, animated spark anchors, and subtle audio/visual differences.
- Give the joint a visible clamp, weld seam, heat emissive state, and temporary smoke.
- Give the valve a wheel/lever pivot and pressure gauge that moves continuously.
- Add at least five power-chain light groups extending into the corridor, fan blades, pump handles, fog emitters, and distant D9 work lights.
- `MaintenanceFeedback` maps snapshots to stable renderer commands; `MothershipWorld.applyMaintenance(snapshot, events)` animates handles without owning gameplay rules.
- Soft failure briefly blacks out local lights and intensifies fog; it must recover automatically.

**Step 4: Verify**

Run: `npm test && npm run build`  
Expected: tests PASS and build succeeds.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/world/buildMaintenanceBay.js 03_SCENE_PIPELINE/3d-prototype/src/world/MothershipWorld.js 03_SCENE_PIPELINE/3d-prototype/src/world/MaintenanceFeedback.js 03_SCENE_PIPELINE/3d-prototype/test/WorldManifest.test.js 03_SCENE_PIPELINE/3d-prototype/test/MaintenanceFeedback.test.js
git commit -m "feat: make maintenance bay reactive"
```

### Task 5: Wire the real-time maintenance runtime

**Files:**
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/main.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/core/InteractionSystem.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/dev/QaScene.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/InteractionSystem.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/QaScene.test.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/MaintenanceRuntime.test.js`

**Step 1: Write failing runtime contract tests**

Test that interaction dispatch preserves target payload, sustained repair suspends walking, tab suspension does not consume oxygen, and QA can deterministically start at locate/weld/valve/complete.

**Step 2: Run focused tests and verify failure**

Run: `npm test -- test/InteractionSystem.test.js test/MaintenanceRuntime.test.js test/QaScene.test.js`  
Expected: FAIL on missing runtime contracts.

**Step 3: Compose the runtime**

- Pass the complete interaction target to `PrologueDirector.handleAction(action, payload)`.
- Create one `MaintenanceChallenge` and one `MaintenanceInput` in `main.js`.
- Probe actions occur through gaze targets; correct probing starts sustained mode.
- During weld/valve phases, suspend walking and update challenge/UI/world/audio each animation frame.
- Pause challenge updates when the page is hidden, a modal is open, pointer control is lost without fallback, or delta exceeds the normal clamp.
- On completion, call `director.completeMaintenance(challenge.snapshot())`, release sustained mode, and restore movement bounds.
- Add development-only `?qa=maintenance-weld`, `maintenance-valve`, and `maintenance-complete` presets.

**Step 4: Verify**

Run: `npm test && npm run build`  
Expected: all tests PASS and build succeeds.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/main.js 03_SCENE_PIPELINE/3d-prototype/src/core/InteractionSystem.js 03_SCENE_PIPELINE/3d-prototype/src/dev/QaScene.js 03_SCENE_PIPELINE/3d-prototype/test/InteractionSystem.test.js 03_SCENE_PIPELINE/3d-prototype/test/MaintenanceRuntime.test.js 03_SCENE_PIPELINE/3d-prototype/test/QaScene.test.js
git commit -m "feat: wire skill-based maintenance loop"
```

### Task 6: Define a deterministic airlock reveal timeline

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/core/ScaleRevealDirector.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/ScaleRevealDirector.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/core/PrologueDirector.js`

**Step 1: Write the failing reveal tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { ScaleRevealDirector, REVEAL_PHASES } from '../src/core/ScaleRevealDirector.js';

test('reveal progresses through pressure, slit, hull, D9 echo, and fracture', () => {
  const reveal = new ScaleRevealDirector();
  reveal.start({ repairQuality: 82 });
  const seen = new Set();
  for (let i = 0; i < 240; i += 1) {
    seen.add(reveal.update(0.1).phase);
  }
  for (const phase of Object.values(REVEAL_PHASES)) assert.ok(seen.has(phase));
  assert.equal(reveal.snapshot().fractureActive, true);
});

test('D9 power echo retains repair quality without blocking reveal', () => {
  const reveal = new ScaleRevealDirector();
  reveal.start({ repairQuality: 22 });
  for (let i = 0; i < 200; i += 1) reveal.update(0.1);
  assert.equal(reveal.snapshot().d9PowerVisible, true);
  assert.equal(reveal.snapshot().powerStability, 0.22);
});
```

**Step 2: Run and verify failure**

Run: `npm test -- test/ScaleRevealDirector.test.js`  
Expected: FAIL because the director does not exist.

**Step 3: Implement the pure timeline**

Export phases `sealed`, `depressurizing`, `slit`, `hull-reveal`, `power-echo`, and `fracture-active`. `start()` captures repair quality; `update(delta)` clamps time and returns a frozen snapshot containing door opening, fog, acoustic vacuum mix, hull exposure, D9 power progress/stability, spotlight bend, fracture intensity, and `traversalOpen`.

**Step 4: Verify**

Run: `npm test`  
Expected: all tests PASS.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/core/ScaleRevealDirector.js 03_SCENE_PIPELINE/3d-prototype/test/ScaleRevealDirector.test.js 03_SCENE_PIPELINE/3d-prototype/src/core/PrologueDirector.js
git commit -m "feat: direct staged airlock reveal"
```

### Task 7: Build foreground, midground, and far-hull scale layers

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/world/buildExteriorScaleLayers.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/world/buildDeploymentBelt.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/world/MothershipWorld.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/WorldManifest.test.js`

**Step 1: Extend the world-manifest test**

Require all three scale layers at every quality tier:

```js
test('exterior preserves scale evidence at every quality tier', () => {
  assert.deepEqual(WORLD_MANIFEST.exterior.layers, ['foreground', 'midground', 'far-hull']);
  assert.ok(WORLD_MANIFEST.exterior.scaleReferences.includes('crew-silhouettes'));
  assert.ok(WORLD_MANIFEST.exterior.scaleReferences.includes('service-train'));
  assert.ok(WORLD_MANIFEST.exterior.scaleReferences.includes('d9-power-band'));
  assert.ok(WORLD_MANIFEST.exterior.movingReferences >= 3);
});
```

**Step 2: Run and verify failure**

Run: `npm test -- test/WorldManifest.test.js`  
Expected: FAIL because layered exterior metadata is absent.

**Step 3: Build the layered exterior**

- Foreground: thick airlock frame, frost planes, cables, grated platform, carrier details, crew silhouettes, and a deep shaft underfoot.
- Midground: service bridges, crane arms, maintenance pods, a slow service train, moving work lights, and passing structural shadow cards.
- Far hull: curved armor bands converging toward multiple vanishing directions, repeated windows, navigation-light sequences, antenna and radiator silhouettes, and a distant D9 power band.
- Move layers at different low velocities relative to the star field to create readable parallax without moving the player platform.
- Pass `QualityManager.preset` into `MothershipWorld`; low quality reduces counts but never removes a layer or the D9 echo.
- Apply `ScaleRevealDirector.snapshot()` to door, fog, layer visibility, lights, movement, and traversal bounds.

**Step 4: Verify**

Run: `npm test && npm run build`  
Expected: tests PASS and build succeeds.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/world/buildExteriorScaleLayers.js 03_SCENE_PIPELINE/3d-prototype/src/world/buildDeploymentBelt.js 03_SCENE_PIPELINE/3d-prototype/src/world/MothershipWorld.js 03_SCENE_PIPELINE/3d-prototype/test/WorldManifest.test.js
git commit -m "feat: layer mothership exterior scale"
```

### Task 8: Replace the circular fracture with a depth wound shader

**Files:**
- Create: `03_SCENE_PIPELINE/3d-prototype/src/world/FractureMaterial.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/world/buildDeploymentBelt.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/world/MothershipWorld.js`
- Create: `03_SCENE_PIPELINE/3d-prototype/test/FractureMaterial.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/RuntimeQuality.test.js`

**Step 1: Write failing pure shader-contract tests**

Export a serializable profile builder and assert that the silhouette is vertical/noncircular, the dark core occludes the background, edge arcs have independent depth layers, and low quality uses fewer samples while preserving the same bounds.

**Step 2: Run and verify failure**

Run: `npm test -- test/FractureMaterial.test.js test/RuntimeQuality.test.js`  
Expected: FAIL because fracture profiles do not exist.

**Step 3: Implement the fracture**

- Use a subdivided vertical plane and GLSL signed-distance field with asymmetric sine/noise distortion.
- Render an opaque near-black core that hides stars, two transparent blue-white edge layers at different depths, and sparse arc particles.
- Animate edge displacement, intensity, and subtle background-adjacent shimmer from a shared time uniform.
- Add a bent spotlight cone that fades or changes direction near the wound.
- Reduced-motion mode lowers displacement speed and flash contrast; low quality reduces plane subdivisions and arc particle count.

**Step 4: Verify**

Run: `npm test && npm run build`  
Expected: tests PASS and build succeeds without shader compile errors.

**Step 5: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/world/FractureMaterial.js 03_SCENE_PIPELINE/3d-prototype/src/world/buildDeploymentBelt.js 03_SCENE_PIPELINE/3d-prototype/src/world/MothershipWorld.js 03_SCENE_PIPELINE/3d-prototype/test/FractureMaterial.test.js 03_SCENE_PIPELINE/3d-prototype/test/RuntimeQuality.test.js
git commit -m "feat: render fracture as depth wound"
```

### Task 9: Add causal audio, final integration, and browser QA

**Files:**
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/core/AudioDirector.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/main.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/src/dev/QaScene.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/RuntimeQuality.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/test/QaScene.test.js`
- Modify: `03_SCENE_PIPELINE/3d-prototype/QA.md`

**Step 1: Extend audio and QA tests**

Require reader-safe signal profiles for probe pulse, wrong cable, breaker trip, stable weld, valve strain, maintenance completion, depressurization, D9 power echo, bent spotlight, and fracture activation. Require QA presets for each maintenance phase and exterior reveal phase.

**Step 2: Run focused tests and verify failure**

Run: `npm test -- test/RuntimeQuality.test.js test/QaScene.test.js`  
Expected: FAIL on missing signal and preset coverage.

**Step 3: Implement causal sound and finish composition**

- Add short procedural signals plus controllable loop gains for electrical search, welding, pressure, breathing, hull groan, airlock vacuum transition, D9 power cascade, and fracture whine.
- Crossfade instead of creating unbounded oscillator graphs; stop or reuse loop nodes on phase changes.
- Ensure mute, reduced motion, pointer-lock fallback, resize, page visibility, and restart remain functional.
- Update `QA.md` with exact test commands, viewports, phase presets, visual evidence, accepted limitations, and any performance warnings.

**Step 4: Run automated verification**

Run: `npm test`  
Expected: every old and new test PASS.  
Run: `npm run build`  
Expected: production build succeeds.  
Run: `git diff --check`  
Expected: no whitespace errors.  
Run: `git status --short -- novel`  
Expected: no output.

**Step 5: Run browser QA**

Use the local Vite server and inspect at minimum:

- Default desktop start and full maintenance completion.
- One wrong-cable soft failure and one weld overheat recovery.
- Maintenance assistance after repeated failure.
- Terminal transition after challenge completion.
- Exterior reveal at sealed, slit, D9 echo, and fracture-active stages.
- Forced `?quality=low` exterior with all three scale layers.
- 390×844 start, maintenance UI, and black-market overlay without horizontal overflow.
- High contrast, reduced motion, mute, keyboard focus, pointer-lock rejection, and drag-look fallback.
- Console errors and shader warnings.

**Step 6: Commit**

```bash
git add 03_SCENE_PIPELINE/3d-prototype/src/core/AudioDirector.js 03_SCENE_PIPELINE/3d-prototype/src/main.js 03_SCENE_PIPELINE/3d-prototype/src/dev/QaScene.js 03_SCENE_PIPELINE/3d-prototype/test/RuntimeQuality.test.js 03_SCENE_PIPELINE/3d-prototype/test/QaScene.test.js 03_SCENE_PIPELINE/3d-prototype/QA.md
git commit -m "feat: complete maintenance reveal slice"
```

### Task 10: Completion audit

**Files:**
- Inspect: `docs/plans/2026-07-14-maintenance-and-scale-reveal-design.md`
- Inspect: `03_SCENE_PIPELINE/3d-prototype/QA.md`
- Inspect: all changed source and test files

**Step 1: Map every design acceptance criterion to evidence**

Create an internal checklist covering 3–5 minute pacing, distinct controls, soft failure and recovery, variable survival results, near-to-far power cascade, visible D9 exterior echo, three scale layers at every quality tier, noncircular occluding fracture, player control, accessibility, reader safety, UTF-8 without BOM, and unchanged `novel/`.

**Step 2: Re-run fresh verification**

Run: `npm test && npm run build`  
Expected: PASS.  
Run: `git diff --check main...HEAD`  
Expected: no output.  
Run: `git status --short`  
Expected: no output after final commit.

**Step 3: Commit any evidence-only corrections**

If QA documentation or tests needed corrections, stage only those files and commit:

```bash
git commit -m "test: close maintenance reveal QA gaps"
```

Do not mark the Goal complete until each design criterion has direct automated or browser evidence.
