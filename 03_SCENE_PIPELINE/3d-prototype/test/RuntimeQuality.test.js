import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseQualityTier, QUALITY_PRESETS } from '../src/core/QualityManager.js';
import { AUDIO_LOOPS, AUDIO_SIGNALS } from '../src/core/AudioDirector.js';
import { createFractureProfile } from '../src/world/FractureMaterial.js';

test('quality selection honors forced tier and conserves weak devices', () => {
  assert.equal(chooseQualityTier({ force: 'low' }), 'low');
  assert.equal(chooseQualityTier({ maxTextureSize: 4096, hardwareConcurrency: 2, devicePixelRatio: 3 }), 'low');
  assert.equal(chooseQualityTier({ maxTextureSize: 8192, hardwareConcurrency: 8, devicePixelRatio: 1 }), 'high');
  assert.equal(QUALITY_PRESETS.low.particles < QUALITY_PRESETS.high.particles, true);
});

test('fracture quality scales samples without changing its silhouette', () => {
  const low = createFractureProfile('low');
  const high = createFractureProfile('high');
  assert.equal(low.silhouette, high.silhouette);
  assert.deepEqual(low.bounds, high.bounds);
  assert.ok(low.subdivisions < high.subdivisions);
  assert.ok(low.arcParticles < high.arcParticles);
});

test('audio language covers every material story action', () => {
  for (const action of ['locate-short', 'secure-joint', 'pull-valve', 'scan-wristband', 'choose-bargain', 'open-airlock', 'enter-fracture']) {
    assert.equal(Object.hasOwn(AUDIO_SIGNALS, action), true, `missing audio signal: ${action}`);
  }
});

test('causal audio covers maintenance mistakes and every exterior reveal beat', () => {
  for (const action of [
    'probe-pulse', 'wrong-cable', 'breaker-trip', 'stable-weld', 'valve-strain',
    'maintenance-complete', 'airlock-depressurize', 'd9-power-echo',
    'spotlight-bend', 'fracture-activate',
  ]) {
    assert.equal(Object.hasOwn(AUDIO_SIGNALS, action), true, `missing causal signal: ${action}`);
  }
  for (const loop of ['electrical-search', 'welding', 'pressure', 'breathing', 'hull-groan', 'fracture-whine']) {
    assert.equal(Object.hasOwn(AUDIO_LOOPS, loop), true, `missing controllable loop: ${loop}`);
    assert.ok(AUDIO_LOOPS[loop].gain > 0);
  }
});
