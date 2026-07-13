import test from 'node:test';
import assert from 'node:assert/strict';
import { PrologueState, BEATS } from '../src/core/PrologueState.js';
import { PrologueDirector } from '../src/core/PrologueDirector.js';

function setup() {
  const calls = [];
  const state = new PrologueState();
  const world = { setProgress: (value) => calls.push(['world', value.beat]) };
  const ui = {
    renderState: (value) => calls.push(['ui-state', value.beat]),
    showSubtitle: (text) => calls.push(['subtitle', text]),
    showTerminal: (value) => calls.push(['terminal', value.debt]),
    showBargain: (choose) => { calls.push(['bargain']); choose('intel'); },
    showEnding: () => calls.push(['ending']),
  };
  const controller = {
    setLegLoad: (value) => calls.push(['leg', value]),
    setBounds: (value) => calls.push(['bounds', value.minZ]),
  };
  return { calls, state, director: new PrologueDirector({ state, world, ui, controller }) };
}

test('repair completion unlocks the terminal corridor', () => {
  const { calls, director, state } = setup();
  director.handleAction('locate-short');
  director.handleAction('secure-joint');
  director.handleAction('pull-valve');
  assert.equal(state.beat, BEATS.TERMINAL);
  assert.equal(calls.some(([type, minZ]) => type === 'bounds' && minZ === -58), true);
});

test('terminal scan renders exact debt before opening black market', () => {
  const { calls, director, state } = setup();
  state.apply('debug-skip-maintenance');
  director.handleAction('scan-wristband');
  assert.equal(state.debt, 40);
  assert.equal(calls.some(([type, debt]) => type === 'terminal' && debt === 40), true);
  assert.equal(calls.some(([type, minZ]) => type === 'bounds' && minZ === -100), true);
});

test('black-market interaction requires a choice but always accepts mission', () => {
  const { calls, director, state } = setup();
  state.apply('debug-skip-black-market');
  director.handleAction('choose-bargain');
  assert.equal(calls.some(([type]) => type === 'bargain'), true);
  assert.equal(state.blackMarketBenefit, 'intel');
  assert.equal(state.missionAccepted, true);
  assert.equal(state.beat, BEATS.DEPLOYMENT);
});

test('airlock reveal precedes chapter ending', () => {
  const { calls, director, state } = setup();
  state.apply('debug-skip-black-market');
  director.handleAction('choose-bargain', { choice: 'medicine' });
  director.handleAction('open-airlock');
  assert.equal(state.beat, BEATS.REVEAL);
  assert.equal(calls.some(([type, minZ]) => type === 'bounds' && minZ === -205), true);
  director.handleAction('enter-fracture');
  assert.equal(state.beat, BEATS.COMPLETE);
  assert.equal(calls.some(([type]) => type === 'ending'), true);
});
