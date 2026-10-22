import test from 'node:test';
import assert from 'node:assert/strict';
import { PrologueState, BEATS } from '../src/core/PrologueState.js';

test('starts in maintenance with chapter-safe survival values', () => {
  const state = new PrologueState();
  assert.equal(state.beat, BEATS.MAINTENANCE);
  assert.equal(state.oxygen, 100);
  assert.equal(state.debt, 0);
  assert.equal(state.deadlineHours, null);
});

test('maintenance result persists player performance and unlocks terminal', () => {
  const state = new PrologueState();

  const result = state.apply('complete-maintenance', {
    complete: true,
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
  assert.equal(state.maintenanceElapsed, 196);
});

test('rejects incomplete or corrupted maintenance results', () => {
  const state = new PrologueState();

  assert.equal(state.apply('complete-maintenance', { complete: false }).ok, false);
  assert.equal(state.apply('complete-maintenance', {
    complete: true,
    oxygen: Number.NaN,
    legLoad: 31,
    repairQuality: 82,
    failureCount: 2,
    elapsed: 196,
  }).ok, false);
  assert.equal(state.beat, BEATS.MAINTENANCE);
});

test('terminal scan establishes the chapter threat', () => {
  const state = new PrologueState();
  state.apply('debug-skip-maintenance');
  assert.equal(state.apply('scan-wristband').ok, true);
  assert.equal(state.debt, 40);
  assert.equal(state.deadlineHours, 72);
  assert.equal(state.beat, BEATS.BLACK_MARKET);
});

test('black-market choice preserves mandatory mission acceptance', () => {
  const state = new PrologueState();
  state.apply('debug-skip-black-market');
  assert.equal(state.apply('choose-bargain', { choice: 'intel' }).ok, true);
  assert.equal(state.missionAccepted, true);
  assert.equal(state.blackMarketBenefit, 'intel');
  assert.equal(state.beat, BEATS.DEPLOYMENT);
});

test('rejects invalid bargain and premature fracture entry', () => {
  const state = new PrologueState();
  assert.equal(state.apply('enter-fracture').ok, false);
  state.apply('debug-skip-black-market');
  assert.equal(state.apply('choose-bargain', { choice: 'everything' }).ok, false);
});
