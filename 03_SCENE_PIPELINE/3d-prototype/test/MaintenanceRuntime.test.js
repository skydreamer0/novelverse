import test from 'node:test';
import assert from 'node:assert/strict';
import { MaintenanceChallenge, MAINTENANCE_PHASES } from '../src/core/MaintenanceChallenge.js';
import { MaintenanceRuntime, shouldTickMaintenance } from '../src/core/MaintenanceRuntime.js';

function setup() {
  const calls = [];
  const challenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
  const input = {
    active: false,
    setActive(value) { this.active = value; calls.push(['input-active', value]); },
    update() {
      return {
        active: this.active,
        alignment: challenge.weldTarget,
        engaged: true,
        pulling: true,
        braced: true,
      };
    },
  };
  const ui = {
    setMaintenanceActive: (value) => calls.push(['ui-active', value]),
    renderMaintenance: (value) => calls.push(['ui-render', value.phase]),
  };
  const world = { applyMaintenance: (value) => calls.push(['world', value.phase]) };
  const director = { completeMaintenance: (value) => { calls.push(['complete', value]); return { ok: true }; } };
  const audio = { signal: (value) => calls.push(['audio', value]) };
  const runtime = new MaintenanceRuntime({ challenge, input, ui, world, director, audio });
  return { calls, challenge, input, runtime };
}

test('runtime pauses for hidden pages, modal UI, and suspended controls', () => {
  assert.equal(shouldTickMaintenance({ active: true, hidden: false, modalOpen: false, controlsAvailable: true, delta: 0.1 }), true);
  assert.equal(shouldTickMaintenance({ active: true, hidden: true, modalOpen: false, controlsAvailable: true, delta: 0.1 }), false);
  assert.equal(shouldTickMaintenance({ active: true, hidden: false, modalOpen: true, controlsAvailable: true, delta: 0.1 }), false);
  assert.equal(shouldTickMaintenance({ active: true, hidden: false, modalOpen: false, controlsAvailable: false, delta: 0.1 }), false);
  assert.equal(shouldTickMaintenance({ active: true, hidden: false, modalOpen: false, controlsAvailable: true, delta: 0.5 }), false);
});

test('probe action preserves cable identity and starts sustained welding', () => {
  const { calls, challenge, runtime } = setup();
  runtime.start();

  const result = runtime.handleAction('probe-cable', { cableId: 'cable-c' });

  assert.equal(result.ok, true);
  assert.equal(challenge.phase, MAINTENANCE_PHASES.WELD);
  assert.equal(runtime.suspendsMovement(), true);
  assert.ok(calls.some(([type, value]) => type === 'audio' && value === 'probe-confirmed'));
});

test('wrong probe remains recoverable and updates world feedback', () => {
  const { calls, challenge, runtime } = setup();
  runtime.start();

  const result = runtime.handleAction('probe-cable', { id: 'cable-a' });

  assert.equal(result.softFailure, 'wrong-cable');
  assert.equal(challenge.phase, MAINTENANCE_PHASES.LOCATE);
  assert.equal(runtime.suspendsMovement(), false);
  assert.ok(calls.some(([type, value]) => type === 'audio' && value === 'wrong-cable'));
  assert.ok(calls.some(([type]) => type === 'world'));
});

test('hidden page does not consume maintenance time', () => {
  const { challenge, runtime } = setup();
  runtime.start();
  const before = challenge.elapsed;

  runtime.update(0.1, { hidden: true, modalOpen: false, controlsAvailable: true });

  assert.equal(challenge.elapsed, before);
});

test('sustained input completes repair and hands result to chapter director', () => {
  const { calls, challenge, runtime } = setup();
  runtime.start();
  runtime.handleAction('probe-cable', { cableId: 'cable-c' });

  for (let frame = 0; frame < 800 && !challenge.complete; frame += 1) {
    runtime.update(0.1, { hidden: false, modalOpen: false, controlsAvailable: true });
  }

  assert.equal(challenge.complete, true);
  assert.equal(runtime.suspendsMovement(), false);
  assert.ok(calls.some(([type]) => type === 'complete'));
});

test('QA phase preparation uses normal challenge transitions', () => {
  const { challenge, runtime } = setup();
  runtime.start();

  assert.equal(runtime.prepareQaPhase('valve'), true);
  assert.equal(challenge.phase, MAINTENANCE_PHASES.VALVE);
  assert.equal(runtime.prepareQaPhase('unknown'), false);
});
