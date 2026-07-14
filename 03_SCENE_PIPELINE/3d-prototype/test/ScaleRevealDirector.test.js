import test from 'node:test';
import assert from 'node:assert/strict';
import { ScaleRevealDirector, REVEAL_PHASES } from '../src/core/ScaleRevealDirector.js';

test('reveal begins sealed and preserves repair quality', () => {
  const reveal = new ScaleRevealDirector();
  const initial = reveal.snapshot();

  assert.equal(initial.phase, REVEAL_PHASES.SEALED);
  assert.equal(initial.active, false);
  assert.equal(initial.doorOpen, 0);

  reveal.start({ repairQuality: 82 });
  assert.equal(reveal.snapshot().active, true);
  assert.equal(reveal.snapshot().powerStability, 0.82);
});

test('reveal progresses through pressure, slit, hull, D9 echo, and fracture', () => {
  const reveal = new ScaleRevealDirector();
  reveal.start({ repairQuality: 82 });
  const seen = new Set();

  for (let frame = 0; frame < 320; frame += 1) {
    seen.add(reveal.update(0.1).phase);
  }

  for (const phase of Object.values(REVEAL_PHASES)) assert.ok(seen.has(phase), `missing reveal phase: ${phase}`);
  assert.equal(reveal.snapshot().fractureActive, true);
  assert.equal(reveal.snapshot().traversalOpen, true);
  assert.equal(reveal.snapshot().doorOpen, 1);
});

test('D9 power echo retains weak repair quality without blocking reveal', () => {
  const reveal = new ScaleRevealDirector();
  reveal.start({ repairQuality: 22 });

  for (let frame = 0; frame < 260; frame += 1) reveal.update(0.1);

  const snapshot = reveal.snapshot();
  assert.equal(snapshot.d9PowerVisible, true);
  assert.equal(snapshot.powerStability, 0.22);
  assert.equal(snapshot.traversalOpen, true);
});

test('timeline exposes continuous render values for every visual layer', () => {
  const reveal = new ScaleRevealDirector();
  reveal.start({ repairQuality: 90 });
  let snapshot;

  for (let frame = 0; frame < 120; frame += 1) snapshot = reveal.update(0.1);

  for (const key of ['doorOpen', 'pressureFog', 'vacuumMix', 'hullExposure', 'd9PowerProgress', 'spotlightBend', 'fractureIntensity']) {
    assert.equal(Number.isFinite(snapshot[key]), true, `${key} must be finite`);
    assert.equal(snapshot[key] >= 0 && snapshot[key] <= 1, true, `${key} must be normalized`);
  }
});

test('invalid or suspended deltas never skip reveal beats', () => {
  const reveal = new ScaleRevealDirector();
  reveal.start({ repairQuality: Number.NaN });
  const before = reveal.snapshot();

  reveal.update(Number.NaN);
  reveal.update(5);

  assert.deepEqual(reveal.snapshot(), before);
  assert.equal(reveal.snapshot().powerStability, 1);
});
