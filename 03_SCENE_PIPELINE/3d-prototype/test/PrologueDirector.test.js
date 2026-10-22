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
  const audio = { signal: (name) => calls.push(['audio', name]) };
  const revealDirector = { start: (value) => calls.push(['reveal-start', value.repairQuality]) };
  return { calls, state, director: new PrologueDirector({ state, world, ui, controller, audio, revealDirector }) };
}

test('completed maintenance persists performance and unlocks the terminal corridor', () => {
  const { calls, director, state } = setup();
  const result = director.completeMaintenance({
    complete: true,
    oxygen: 71,
    legLoad: 29,
    repairQuality: 78,
    failureCount: 2,
    elapsed: 204,
  });

  assert.equal(result.ok, true);
  assert.equal(state.beat, BEATS.TERMINAL);
  assert.equal(state.repairQuality, 78);
  assert.equal(calls.some(([type, minZ]) => type === 'bounds' && minZ === -58), true);
  assert.equal(calls.some(([type, signal]) => type === 'audio' && signal === 'maintenance-complete'), true);
});

test('director refuses an unfinished maintenance challenge', () => {
  const { director, state } = setup();

  const result = director.completeMaintenance({ complete: false });

  assert.equal(result.ok, false);
  assert.equal(state.beat, BEATS.MAINTENANCE);
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
  assert.equal(calls.some(([type, quality]) => type === 'reveal-start' && quality === 100), true);
  director.handleAction('enter-fracture');
  assert.equal(state.beat, BEATS.COMPLETE);
  assert.equal(calls.some(([type]) => type === 'ending'), true);
});
