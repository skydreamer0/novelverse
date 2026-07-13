import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_MANIFEST } from '../src/world/MothershipWorld.js';

test('world zones follow chapter 1 order with unique ids', () => {
  assert.deepEqual(WORLD_MANIFEST.zones.map((zone) => zone.id), [
    'maintenance', 'terminal', 'black-market', 'deployment', 'exterior',
  ]);
  assert.equal(new Set(WORLD_MANIFEST.zones.map((zone) => zone.id)).size, WORLD_MANIFEST.zones.length);
});

test('world carries mothership identity cues instead of generic debris', () => {
  const cues = new Set(WORLD_MANIFEST.identityCues);
  for (const cue of ['curved-hull', 'life-support-pipes', 'maintenance-abyss', 'airlock', 'hull-exterior', 'navigation-lights', 'fracture']) {
    assert.equal(cues.has(cue), true, `missing identity cue: ${cue}`);
  }
});

test('exterior reveal is dominated by a readable curved hull', () => {
  assert.equal(WORLD_MANIFEST.exteriorHullStrips >= 9, true);
  assert.equal(WORLD_MANIFEST.exteriorHullSeams >= 9, true);
  assert.equal(WORLD_MANIFEST.exteriorFillLights >= 2, true);
  assert.equal(WORLD_MANIFEST.exteriorFillIntensity >= 600, true);
  assert.equal(WORLD_MANIFEST.airlockPlane, 'xy');
});

test('maintenance pipe jungle preserves a readable player aisle', () => {
  assert.equal(WORLD_MANIFEST.maintenanceClearance >= 3.6, true);
  assert.equal(WORLD_MANIFEST.ribPlane, 'xy');
});

test('world exposes every required chapter interaction', () => {
  const actions = new Set(WORLD_MANIFEST.interactions.map((item) => item.action));
  for (const action of ['locate-short', 'secure-joint', 'pull-valve', 'scan-wristband', 'choose-bargain', 'open-airlock', 'enter-fracture']) {
    assert.equal(actions.has(action), true, `missing action: ${action}`);
  }
});
