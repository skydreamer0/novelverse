import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { MothershipWorld, WORLD_MANIFEST } from '../src/world/MothershipWorld.js';
import { buildMaintenanceBay } from '../src/world/buildMaintenanceBay.js';
import { createMaterials } from '../src/world/materials.js';

test('world zones follow chapter 1 order with unique ids', () => {
  assert.deepEqual(WORLD_MANIFEST.zones.map((zone) => zone.id), [
    'maintenance', 'terminal', 'black-market', 'deployment', 'exterior',
  ]);
  assert.equal(new Set(WORLD_MANIFEST.zones.map((zone) => zone.id)).size, WORLD_MANIFEST.zones.length);
});

test('world carries mothership identity cues instead of generic debris', () => {
  const cues = new Set(WORLD_MANIFEST.identityCues);
  for (const cue of ['curved-hull', 'life-support-pipes', 'maintenance-abyss', 'airlock', 'hull-exterior', 'navigation-lights', 'fracture']) {
    assert.equal(cues.has(cue), true, `missing identity cue: ${cue}`);
  }
});

test('exterior reveal is dominated by a readable curved hull', () => {
  assert.equal(WORLD_MANIFEST.exteriorHullStrips >= 9, true);
  assert.equal(WORLD_MANIFEST.exteriorHullSeams >= 9, true);
  assert.equal(WORLD_MANIFEST.exteriorFillLights >= 2, true);
  assert.equal(WORLD_MANIFEST.exteriorFillIntensity >= 600, true);
  assert.equal(WORLD_MANIFEST.airlockPlane, 'xy');
});

test('exterior preserves scale evidence at every quality tier', () => {
  assert.deepEqual(WORLD_MANIFEST.exterior.layers, ['foreground', 'midground', 'far-hull']);
  for (const reference of ['crew-silhouettes', 'service-train', 'd9-power-band']) {
    assert.ok(WORLD_MANIFEST.exterior.scaleReferences.includes(reference), `missing scale reference: ${reference}`);
  }
  assert.ok(WORLD_MANIFEST.exterior.movingReferences >= 3);
  assert.deepEqual(Object.keys(WORLD_MANIFEST.exterior.qualityTiers), ['low', 'medium', 'high']);
  for (const tier of Object.values(WORLD_MANIFEST.exterior.qualityTiers)) {
    assert.ok(tier.hullSections >= 7);
    assert.ok(tier.navigationLights >= 18);
  }
});

test('maintenance pipe jungle preserves a readable player aisle', () => {
  assert.equal(WORLD_MANIFEST.maintenanceClearance >= 3.6, true);
  assert.equal(WORLD_MANIFEST.ribPlane, 'xy');
});

test('maintenance bay exposes skill interaction and power-chain cues', () => {
  assert.equal(WORLD_MANIFEST.maintenance.cableCandidates, 3);
  assert.deepEqual(WORLD_MANIFEST.maintenance.phases, ['locate', 'weld', 'valve']);
  assert.ok(WORLD_MANIFEST.maintenance.powerChainSections >= 5);
  assert.ok(WORLD_MANIFEST.maintenance.softFailureCues.includes('breaker-blackout'));
  assert.ok(WORLD_MANIFEST.maintenance.softFailureCues.includes('pressure-fog'));
});

test('candidate cables begin with identical visual treatment', () => {
  const bay = buildMaintenanceBay(createMaterials());
  const sheathColors = bay.handles.cableCandidates.map((cable) => cable.children[0].material.color.getHex());
  const sparkColors = bay.handles.sparkAnchors.map((spark) => spark.material.color.getHex());
  const sparkIntensity = bay.handles.sparkAnchors.map((spark) => spark.material.emissiveIntensity);
  const sparkScales = bay.handles.sparkAnchors.map((spark) => spark.scale.x);

  assert.equal(new Set(sheathColors).size, 1);
  assert.equal(new Set(sparkColors).size, 1);
  assert.equal(new Set(sparkIntensity).size, 1);
  assert.equal(new Set(sparkScales).size, 1);
});

test('reduced motion freezes ambient travel and reveal pulses', () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x10151a, 0.018);
  const world = new MothershipWorld(scene, { qualityTier: 'low', reducedMotion: true });
  const trainZ = world.deployment.handles.serviceTrain.position.z;

  world.update(0.1);
  assert.equal(world.deployment.handles.serviceTrain.position.z, trainZ);

  const reveal = {
    vacuumMix: 1,
    doorOpen: 0.5,
    pressureFog: 0,
    d9PowerProgress: 0,
    powerStability: 1,
    hullExposure: 1,
    fractureIntensity: 0,
    spotlightBend: 0,
    traversalOpen: false,
  };
  world.applyReveal({ ...reveal, elapsed: 0 });
  const warningIntensity = world.deployment.handles.warningLights[0].material.emissiveIntensity;
  world.applyReveal({ ...reveal, elapsed: 1 });
  assert.equal(world.deployment.handles.warningLights[0].material.emissiveIntensity, warningIntensity);

  world.setReducedMotion(false);
  world.update(0.1);
  assert.notEqual(world.deployment.handles.serviceTrain.position.z, trainZ);
});

test('world exposes every required chapter interaction', () => {
  const actions = new Set(WORLD_MANIFEST.interactions.map((item) => item.action));
  for (const action of ['probe-cable', 'start-weld', 'start-valve', 'scan-wristband', 'choose-bargain', 'open-airlock', 'enter-fracture']) {
    assert.equal(actions.has(action), true, `missing action: ${action}`);
  }
});
