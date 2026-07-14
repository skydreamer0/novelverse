import test from 'node:test';
import assert from 'node:assert/strict';
import { FRACTURE_BOUNDS, createFractureProfile } from '../src/world/FractureMaterial.js';

test('fracture reads as a vertical depth wound rather than a circular portal', () => {
  const profile = createFractureProfile('high');
  assert.equal(profile.silhouette, 'vertical-wound');
  assert.ok(profile.aspectRatio < 0.5);
  assert.equal(profile.occludesBackground, true);
  assert.ok(profile.edgeDepthLayers >= 2);
  assert.ok(profile.asymmetry > 0);
});

test('quality profiles preserve fracture bounds while reducing shader work', () => {
  const low = createFractureProfile('low');
  const medium = createFractureProfile('medium');
  const high = createFractureProfile('high');
  assert.deepEqual(low.bounds, FRACTURE_BOUNDS);
  assert.deepEqual(medium.bounds, FRACTURE_BOUNDS);
  assert.deepEqual(high.bounds, FRACTURE_BOUNDS);
  assert.ok(low.subdivisions < medium.subdivisions);
  assert.ok(medium.subdivisions < high.subdivisions);
  assert.ok(low.arcParticles < high.arcParticles);
});

test('reduced motion retains the wound while slowing displacement and flash', () => {
  const standard = createFractureProfile('high');
  const reduced = createFractureProfile('high', { reducedMotion: true });
  assert.deepEqual(reduced.bounds, standard.bounds);
  assert.equal(reduced.silhouette, standard.silhouette);
  assert.ok(reduced.displacementSpeed < standard.displacementSpeed);
  assert.ok(reduced.flashContrast < standard.flashContrast);
});
