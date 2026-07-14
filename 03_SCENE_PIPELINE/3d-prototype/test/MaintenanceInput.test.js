import test from 'node:test';
import assert from 'node:assert/strict';
import { MaintenanceInput, mapMaintenanceKeys } from '../src/core/MaintenanceInput.js';

function fakeTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    dispatch(type, event) { listeners.get(type)?.(event); },
  };
}

test('maps keyboard controls without requiring pointer precision', () => {
  assert.deepEqual(mapMaintenanceKeys(new Set(['KeyA', 'Space'])), {
    alignmentDelta: -1,
    engaged: true,
    pulling: true,
    braced: false,
  });
  assert.equal(mapMaintenanceKeys(new Set(['ArrowRight', 'ShiftLeft'])).alignmentDelta, 1);
  assert.equal(mapMaintenanceKeys(new Set(['ArrowRight', 'ShiftLeft'])).braced, true);
});

test('active maintenance input accumulates alignment and resets when released', () => {
  const target = fakeTarget();
  const input = new MaintenanceInput({ target });
  input.setActive(true);
  target.dispatch('keydown', { code: 'KeyA', repeat: false, preventDefault() {} });
  target.dispatch('keydown', { code: 'Space', repeat: false, preventDefault() {} });

  const active = input.update(0.5);
  assert.ok(active.alignment < 0);
  assert.equal(active.engaged, true);
  assert.equal(active.pulling, true);

  target.dispatch('keyup', { code: 'KeyA', preventDefault() {} });
  target.dispatch('keyup', { code: 'Space', preventDefault() {} });
  assert.equal(input.update(0.1).engaged, false);

  input.setActive(false);
  assert.deepEqual(input.snapshot(), {
    active: false,
    alignment: 0,
    engaged: false,
    pulling: false,
    braced: false,
  });
  input.dispose();
  assert.equal(target.listeners.size, 0);
});

test('maintenance input clamps alignment and ignores unrelated keys', () => {
  const target = fakeTarget();
  const input = new MaintenanceInput({ target });
  input.setActive(true);
  target.dispatch('keydown', { code: 'KeyD', repeat: false, preventDefault() {} });
  target.dispatch('keydown', { code: 'KeyQ', repeat: false, preventDefault() {} });

  for (let frame = 0; frame < 30; frame += 1) input.update(0.1);

  assert.equal(input.snapshot().alignment, 1);
  input.dispose();
});
