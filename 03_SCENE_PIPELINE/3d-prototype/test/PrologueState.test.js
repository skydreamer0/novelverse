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

test('repair steps must be completed in order', () => {
  const state = new PrologueState();
  assert.equal(state.apply('pull-valve').ok, false);
  assert.equal(state.apply('locate-short').ok, true);
  assert.equal(state.apply('secure-joint').ok, true);
  assert.equal(state.apply('pull-valve').ok, true);
  assert.equal(state.beat, BEATS.TERMINAL);
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
