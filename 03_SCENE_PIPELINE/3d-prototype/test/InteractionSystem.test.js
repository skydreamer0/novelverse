import test from 'node:test';
import assert from 'node:assert/strict';
import { rankInteractionTargets } from '../src/core/InteractionSystem.js';

test('selects the nearest enabled target within reach', () => {
  const selected = rankInteractionTargets([
    { id: 'far', distance: 3.5, maxDistance: 4, enabled: true, priority: 0 },
    { id: 'near', distance: 1.2, maxDistance: 4, enabled: true, priority: 0 },
  ]);
  assert.equal(selected.id, 'near');
});

test('rejects disabled and out-of-range targets', () => {
  const selected = rankInteractionTargets([
    { id: 'disabled', distance: 1, maxDistance: 4, enabled: false, priority: 9 },
    { id: 'distant', distance: 6, maxDistance: 4, enabled: true, priority: 9 },
  ]);
  assert.equal(selected, null);
});

test('uses priority before distance and id for stable ties', () => {
  const prioritized = rankInteractionTargets([
    { id: 'near', distance: 1, maxDistance: 4, enabled: true, priority: 0 },
    { id: 'story', distance: 2, maxDistance: 4, enabled: true, priority: 2 },
  ]);
  assert.equal(prioritized.id, 'story');

  const tied = rankInteractionTargets([
    { id: 'b', distance: 2, maxDistance: 4, enabled: true, priority: 1 },
    { id: 'a', distance: 2, maxDistance: 4, enabled: true, priority: 1 },
  ]);
  assert.equal(tied.id, 'a');
});
