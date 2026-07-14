import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveMaintenanceFeedback } from '../src/world/MaintenanceFeedback.js';

test('wrong cable trips the breaker without erasing locate progress', () => {
  const previous = { phase: 'locate', failureCount: 0, excludedCables: [] };
  const next = {
    phase: 'locate',
    failureCount: 1,
    lastSoftFailure: 'wrong-cable',
    excludedCables: ['cable-a'],
  };

  const feedback = deriveMaintenanceFeedback(previous, next);

  assert.ok(feedback.events.includes('breaker-blackout'));
  assert.ok(feedback.events.includes('pressure-fog'));
  assert.deepEqual(feedback.excludedCables, ['cable-a']);
  assert.equal(feedback.powerSections, 0);
});

test('weld overheat and valve slip produce distinct physical feedback', () => {
  const overheat = deriveMaintenanceFeedback(
    { phase: 'weld', failureCount: 0 },
    { phase: 'weld', failureCount: 1, lastSoftFailure: 'weld-overheat', weldHeat: 0.2 },
  );
  const slip = deriveMaintenanceFeedback(
    { phase: 'valve', failureCount: 1 },
    { phase: 'valve', failureCount: 2, lastSoftFailure: 'valve-slip', valveProgress: 0.2 },
  );

  assert.ok(overheat.events.includes('weld-spark-burst'));
  assert.equal(overheat.blackout, 1);
  assert.ok(slip.events.includes('valve-kick'));
  assert.equal(slip.cameraImpulse > 0, true);
});

test('phase changes and completion drive near-to-far power restoration', () => {
  const phaseChange = deriveMaintenanceFeedback(
    { phase: 'locate', complete: false },
    { phase: 'weld', complete: false, weldProgress: 0 },
  );
  const complete = deriveMaintenanceFeedback(
    { phase: 'valve', complete: false },
    { phase: 'complete', complete: true, repairQuality: 78, valveProgress: 1 },
  );

  assert.ok(phaseChange.events.includes('phase-weld'));
  assert.ok(complete.events.includes('power-cascade'));
  assert.equal(complete.powerSections, 6);
  assert.equal(complete.powerStability, 0.78);
});

test('feedback clamps malformed visual values', () => {
  const feedback = deriveMaintenanceFeedback({}, {
    phase: 'weld',
    weldHeat: 5,
    weldProgress: -2,
    valveProgress: Number.NaN,
    repairQuality: 1000,
    excludedCables: null,
  });

  assert.equal(feedback.weldHeat, 1);
  assert.equal(feedback.weldProgress, 0);
  assert.equal(feedback.valveProgress, 0);
  assert.deepEqual(feedback.excludedCables, []);
});
