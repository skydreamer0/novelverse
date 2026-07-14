import test from 'node:test';
import assert from 'node:assert/strict';
import { qaScenePreset } from '../src/dev/QaScene.js';

test('QA presets preserve chapter order and never invent story events', () => {
  const reveal = qaScenePreset('reveal');
  assert.deepEqual(reveal.events.map((item) => item.action), [
    'complete-maintenance', 'scan-wristband', 'choose-bargain', 'open-airlock',
  ]);
  assert.deepEqual(reveal.position, [0, 1.65, -166]);
  assert.equal(reveal.pitch, -0.12);
  assert.equal(reveal.revealElapsed, 21.5);
  assert.equal(qaScenePreset('unknown'), null);
});

test('QA presets expose every exterior reveal phase through the real timeline', () => {
  const expected = {
    'reveal-sealed': ['sealed', 0],
    'reveal-pressure': ['depressurizing', 2.5],
    'reveal-slit': ['slit', 5.8],
    'reveal-hull': ['hull-reveal', 9.5],
    'reveal-d9': ['power-echo', 14.5],
    'reveal-fracture': ['fracture-active', 21.5],
  };
  for (const [name, [phase, elapsed]] of Object.entries(expected)) {
    const preset = qaScenePreset(name);
    assert.equal(preset.revealPhase, phase);
    assert.equal(preset.revealElapsed, elapsed);
    assert.equal(preset.events.at(-1).action, 'open-airlock');
  }
});

test('QA presets expose every maintenance phase without inventing story outcomes', () => {
  assert.equal(qaScenePreset('maintenance-locate').maintenancePhase, 'locate');
  assert.equal(qaScenePreset('maintenance-weld').maintenancePhase, 'weld');
  assert.equal(qaScenePreset('maintenance-valve').maintenancePhase, 'valve');
  assert.equal(qaScenePreset('maintenance-complete').maintenancePhase, 'complete');
  assert.deepEqual(qaScenePreset('maintenance-weld').events, []);
});

test('QA presets expose recoverable maintenance failure states', () => {
  assert.equal(qaScenePreset('maintenance-wrong-cable').maintenanceCondition, 'wrong-cable');
  assert.equal(qaScenePreset('maintenance-overheat').maintenanceCondition, 'weld-overheat');
  assert.equal(qaScenePreset('maintenance-assisted').maintenanceCondition, 'assisted');
});
