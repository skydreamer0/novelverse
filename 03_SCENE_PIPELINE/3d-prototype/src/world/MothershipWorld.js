import * as THREE from 'three';
import { createMaterials } from './materials.js';
import { buildMaintenanceBay } from './buildMaintenanceBay.js';
import { buildTerminalCorridor } from './buildTerminalCorridor.js';
import { buildBlackMarket } from './buildBlackMarket.js';
import { buildDeploymentBelt } from './buildDeploymentBelt.js';
import { deriveMaintenanceFeedback } from './MaintenanceFeedback.js';

export const WORLD_MANIFEST = Object.freeze({
  maintenanceClearance: 4,
  ribPlane: 'xy',
  exteriorHullStrips: 9,
  exteriorHullSeams: 9,
  exteriorFillLights: 2,
  exteriorFillIntensity: 800,
  airlockPlane: 'xy',
  maintenance: {
    cableCandidates: 3,
    phases: ['locate', 'weld', 'valve'],
    powerChainSections: 6,
    softFailureCues: ['breaker-blackout', 'pressure-fog', 'weld-spark-burst', 'valve-kick'],
  },
  zones: [
    { id: 'maintenance', z: 0 },
    { id: 'terminal', z: -38 },
    { id: 'black-market', z: -82 },
    { id: 'deployment', z: -126 },
    { id: 'exterior', z: -170 },
  ],
  identityCues: ['curved-hull', 'life-support-pipes', 'maintenance-abyss', 'airlock', 'hull-exterior', 'navigation-lights', 'fracture'],
  interactions: [
    { id: 'cables', action: 'probe-cable' },
    { id: 'joint', action: 'start-weld' },
    { id: 'valve', action: 'start-valve' },
    { id: 'terminal', action: 'scan-wristband' },
    { id: 'sulan', action: 'choose-bargain' },
    { id: 'airlock', action: 'open-airlock' },
    { id: 'fracture', action: 'enter-fracture' },
  ],
});

export class MothershipWorld {
  constructor(scene) {
    this.scene = scene;
    this.materials = createMaterials();
    this.interactables = [];
    this.elapsed = 0;
    this.shake = 0;
    this.maintenanceSnapshot = null;
    this.maintenanceBlackout = 0;
    this.maintenanceFog = 0;
    this.maintenanceCascadeElapsed = 0;
    this.powerRestoreTarget = 0;

    this.maintenance = this.#add(buildMaintenanceBay(this.materials));
    this.terminal = this.#add(buildTerminalCorridor(this.materials));
    this.market = this.#add(buildBlackMarket(this.materials));
    this.deployment = this.#add(buildDeploymentBelt(this.materials));

    this.scene.add(new THREE.AmbientLight(0x31404a, 0.38));
    this.maintenanceLight = new THREE.PointLight(0xe09a58, 2.1, 26);
    this.maintenanceLight.position.set(0, 3.8, 2);
    this.scene.add(this.maintenanceLight);
    const corridorLight = new THREE.PointLight(0x76949a, 1.5, 45);
    corridorLight.position.set(0, 3.4, -40);
    this.scene.add(corridorLight);
    const exteriorLight = new THREE.DirectionalLight(0x95b9cf, 2.2);
    exteriorLight.position.set(30, 50, -120);
    this.scene.add(exteriorLight);
  }

  #add(zone) {
    this.scene.add(zone.root);
    this.interactables.push(...zone.interactables);
    return zone;
  }

  getInteractables() {
    return this.interactables;
  }

  setProgress(snapshot) {
    const byId = Object.fromEntries(this.interactables.map((item) => [item.id, item]));
    for (const id of ['cable-a', 'cable-b', 'cable-c']) {
      if (byId[id]) byId[id].enabled = snapshot.beat === 'maintenance' && snapshot.repairStep === 0;
    }
    if (byId.joint) byId.joint.enabled = snapshot.beat === 'maintenance' && snapshot.repairStep === 1;
    if (byId.valve) byId.valve.enabled = snapshot.beat === 'maintenance' && snapshot.repairStep === 2;
    byId.terminal.enabled = snapshot.beat === 'terminal';
    byId.sulan.enabled = snapshot.beat === 'black-market';
    byId.airlock.enabled = snapshot.beat === 'deployment';
    byId.fracture.enabled = snapshot.beat === 'reveal';

    const [red, amber, green] = this.maintenance.handles.lights;
    red.material.emissiveIntensity = snapshot.repairStep < 1 ? 2.5 : 0.08;
    amber.material.emissiveIntensity = snapshot.repairStep === 1 || snapshot.repairStep === 2 ? 2.2 : 0.08;
    green.material.emissiveIntensity = snapshot.repairStep === 3 ? 2.5 : 0.08;
    if (snapshot.airlockOpen) this.deployment.handles.door.position.y = 8.5;
  }

  applyMaintenance(snapshot) {
    const feedback = deriveMaintenanceFeedback(this.maintenanceSnapshot ?? {}, snapshot);
    this.maintenanceSnapshot = snapshot;
    if (feedback.blackout) this.maintenanceBlackout = 1;
    if (feedback.fogBurst) this.maintenanceFog = 1;
    if (feedback.cameraImpulse) this.shake = Math.max(this.shake, feedback.cameraImpulse);
    if (feedback.events.includes('power-cascade')) {
      this.powerRestoreTarget = feedback.powerSections;
      this.maintenanceCascadeElapsed = 0;
    }

    const byId = Object.fromEntries(this.interactables.map((item) => [item.id, item]));
    for (const id of ['cable-a', 'cable-b', 'cable-c']) {
      if (byId[id]) byId[id].enabled = snapshot.phase === 'locate' && !feedback.excludedCables.includes(id);
    }
    if (byId.joint) byId.joint.enabled = snapshot.phase === 'weld';
    if (byId.valve) byId.valve.enabled = snapshot.phase === 'valve';

    this.maintenance.handles.weldSeam.material.emissiveIntensity = 0.25 + feedback.weldHeat * 4;
    this.maintenance.handles.weldSeam.scale.x = 0.25 + feedback.weldProgress * 0.75;
    this.maintenance.handles.valvePivot.rotation.z = -feedback.valveProgress * Math.PI * 0.72;
    this.maintenance.handles.gaugeNeedle.rotation.z = -1.15 + feedback.valveResistance * 2.3;
    return feedback;
  }

  update(delta) {
    this.elapsed += delta;
    this.maintenanceBlackout = Math.max(0, this.maintenanceBlackout - delta * 0.72);
    this.maintenanceFog = Math.max(0, this.maintenanceFog - delta * 0.34);
    this.shake = Math.max(0, this.shake - delta * 1.8);
    this.maintenanceLight.intensity = 2.1 * (1 - this.maintenanceBlackout * 0.92);
    this.maintenanceCascadeElapsed += delta;
    const powered = Math.min(this.powerRestoreTarget, Math.floor(this.maintenanceCascadeElapsed * 2.4) + 1);
    this.maintenance.handles.powerChain.forEach((light, index) => {
      light.material.emissiveIntensity = index < powered ? 2.4 : 0.08;
    });
    this.maintenance.handles.fogPlanes.forEach((fog, index) => {
      fog.material.opacity = this.maintenanceFog * (0.08 + index * 0.012);
      fog.position.y += delta * (0.18 + index * 0.01);
      if (fog.position.y > 4.2) fog.position.y = 0.45;
    });
    this.maintenance.handles.fanBlades.forEach((fan, index) => {
      const running = this.powerRestoreTarget > index % 3 ? 1 : 0.08;
      fan.rotation.z += delta * running * (1.2 + index * 0.15);
    });
    const pulse = 0.72 + Math.sin(this.elapsed * 8.5) * 0.28;
    this.deployment.handles.arc.material.opacity = pulse;
    this.deployment.handles.fracture.rotation.z = Math.sin(this.elapsed * 2.2) * 0.025;
    this.deployment.handles.stars.position.x = Math.sin(this.elapsed * 0.025) * 0.7;
    this.maintenance.root.position.x = Math.sin(this.elapsed * 0.7) * 0.003 + Math.sin(this.elapsed * 31) * this.shake * 0.012;
    this.maintenance.handles.sparkAnchors.forEach((spark, index) => {
      spark.material.emissiveIntensity = 0.5 + Math.max(0, Math.sin(this.elapsed * (7 + index))) * (index === 2 ? 4 : 1.2);
    });
  }
}
