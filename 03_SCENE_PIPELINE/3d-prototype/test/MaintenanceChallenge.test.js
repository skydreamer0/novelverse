import test from 'node:test';
import assert from 'node:assert/strict';
import { MaintenanceChallenge, MAINTENANCE_PHASES } from '../src/core/MaintenanceChallenge.js';

function weldToValve(challenge) {
  for (let frame = 0; frame < 300 && challenge.phase === MAINTENANCE_PHASES.WELD; frame += 1) {
    challenge.update(0.1, { engaged: true, alignment: challenge.weldTarget });
  }
  assert.equal(challenge.phase, MAINTENANCE_PHASES.VALVE);
}

test('wrong cable causes a recoverable breaker trip', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  const result = challenge.probeCable('cable-a');

  assert.equal(result.ok, false);
  assert.equal(result.softFailure, 'wrong-cable');
  assert.equal(challenge.phase, MAINTENANCE_PHASES.LOCATE);
  assert.equal(challenge.failureCount, 1);
  assert.ok(challenge.oxygen < 100);
  assert.ok(challenge.snapshot().excludedCables.includes('cable-a'));
});

test('correct cable advances to a sustained weld', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });

  assert.equal(challenge.probeCable('cable-c').ok, true);
  assert.equal(challenge.phase, MAINTENANCE_PHASES.WELD);
  weldToValve(challenge);
});

test('active challenge consumes time and oxygen without becoming lethal', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });

  for (let frame = 0; frame < 6000; frame += 1) challenge.update(0.1, {});

  assert.ok(challenge.elapsed > 500);
  assert.equal(challenge.oxygen, 18);
  assert.equal(challenge.phase, MAINTENANCE_PHASES.LOCATE);
});

test('overheat resets only weld progress and unlocks assistance', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  challenge.probeCable('cable-c');

  for (let failure = 0; failure < 2; failure += 1) {
    for (let frame = 0; frame < 180 && challenge.failureCount === failure; frame += 1) {
      challenge.update(0.1, { engaged: true, alignment: 1 });
    }
  }

  assert.equal(challenge.phase, MAINTENANCE_PHASES.WELD);
  assert.ok(challenge.assistLevel > 0);
  assert.ok(challenge.weldProgress < 1);
  assert.ok(challenge.snapshot().safeWindow > 0.12);
});

test('unbraced pulling at a resistance peak slips without resetting the phase', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  challenge.probeCable('cable-c');
  weldToValve(challenge);
  const before = challenge.snapshot();

  let slip = null;
  for (let frame = 0; frame < 80 && !slip; frame += 1) {
    const result = challenge.update(0.1, { pulling: true, braced: false });
    if (result.softFailure === 'valve-slip') slip = result;
  }

  assert.equal(slip?.softFailure, 'valve-slip');
  assert.equal(challenge.phase, MAINTENANCE_PHASES.VALVE);
  assert.ok(challenge.legLoad > before.legLoad);
});

test('braced valve work completes with a graded serializable result', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  challenge.probeCable('cable-c');
  weldToValve(challenge);

  for (let frame = 0; frame < 400 && !challenge.complete; frame += 1) {
    challenge.update(0.1, { pulling: true, braced: true });
  }

  const snapshot = challenge.snapshot();
  assert.equal(snapshot.phase, MAINTENANCE_PHASES.COMPLETE);
  assert.equal(snapshot.complete, true);
  assert.ok(snapshot.repairQuality >= 1 && snapshot.repairQuality <= 100);
  assert.ok(snapshot.elapsed > 0);
  assert.doesNotThrow(() => JSON.stringify(snapshot));
  assert.throws(() => { snapshot.oxygen = 0; }, TypeError);
});

test('invalid delta and cable input never corrupt challenge state', () => {
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  const before = challenge.snapshot();

  assert.equal(challenge.probeCable('').ok, false);
  challenge.update(Number.NaN, { engaged: true, alignment: Number.POSITIVE_INFINITY });

  assert.deepEqual(challenge.snapshot(), before);
});
