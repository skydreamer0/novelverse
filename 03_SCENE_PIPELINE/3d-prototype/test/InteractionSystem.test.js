import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { InteractionSystem, rankInteractionTargets } from '../src/core/InteractionSystem.js';

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

test('selected interaction preserves semantic payload for maintenance', () => {
  const selected = rankInteractionTargets([
    { id: 'cable-c', cableId: 'cable-c', action: 'probe-cable', distance: 1.4, enabled: true },
  ]);

  assert.equal(selected.action, 'probe-cable');
  assert.equal(selected.cableId, 'cable-c');
});

test('ray reach follows a target max distance beyond the default range', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { addEventListener() {}, removeEventListener() {} };
  try {
    const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 800);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
    camera.updateMatrixWorld(true);
    const wound = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 8),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
    );
    wound.position.z = -6;
    wound.updateMatrixWorld(true);
    let prompted = null;
    const interaction = new InteractionSystem(camera, { onPrompt: (target) => { prompted = target; } });
    interaction.setTargets([
      { id: 'fracture', object: wound, action: 'enter-fracture', maxDistance: 7.5, enabled: true },
    ]);

    interaction.update();

    assert.equal(prompted?.id, 'fracture');
    interaction.dispose();
  } finally {
    globalThis.document = previousDocument;
  }
});
