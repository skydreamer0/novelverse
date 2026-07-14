import test from 'node:test';
import assert from 'node:assert/strict';
import { qaScenePreset } from '../src/dev/QaScene.js';

test('QA presets preserve chapter order and never invent story events', () => {
  const reveal = qaScenePreset('reveal');
  assert.deepEqual(reveal.events.map((item) => item.action), [
    'complete-maintenance', 'scan-wristband', 'choose-bargain', 'open-airlock',
  ]);
  assert.deepEqual(reveal.position, [0, 1.65, -154]);
  assert.equal(reveal.pitch, 0.16);
  assert.equal(qaScenePreset('unknown'), null);
});

test('QA presets expose every maintenance phase without inventing story outcomes', () => {
  assert.equal(qaScenePreset('maintenance-locate').maintenancePhase, 'locate');
  assert.equal(qaScenePreset('maintenance-weld').maintenancePhase, 'weld');
  assert.equal(qaScenePreset('maintenance-valve').maintenancePhase, 'valve');
  assert.equal(qaScenePreset('maintenance-complete').maintenancePhase, 'complete');
  assert.deepEqual(qaScenePreset('maintenance-weld').events, []);
});
