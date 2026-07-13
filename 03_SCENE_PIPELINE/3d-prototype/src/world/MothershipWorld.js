import * as THREE from 'three';
import { createMaterials } from './materials.js';
import { buildMaintenanceBay } from './buildMaintenanceBay.js';
import { buildTerminalCorridor } from './buildTerminalCorridor.js';
import { buildBlackMarket } from './buildBlackMarket.js';
import { buildDeploymentBelt } from './buildDeploymentBelt.js';

export const WORLD_MANIFEST = Object.freeze({
  zones: [
    { id: 'maintenance', z: 0 },
    { id: 'terminal', z: -38 },
    { id: 'black-market', z: -82 },
    { id: 'deployment', z: -126 },
    { id: 'exterior', z: -170 },
  ],
  identityCues: ['curved-hull', 'life-support-pipes', 'maintenance-abyss', 'airlock', 'hull-exterior', 'navigation-lights', 'fracture'],
  interactions: [
    { id: 'short', action: 'locate-short' },
    { id: 'joint', action: 'secure-joint' },
    { id: 'valve', action: 'pull-valve' },
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

    this.maintenance = this.#add(buildMaintenanceBay(this.materials));
    this.terminal = this.#add(buildTerminalCorridor(this.materials));
    this.market = this.#add(buildBlackMarket(this.materials));
    this.deployment = this.#add(buildDeploymentBelt(this.materials));

    this.scene.add(new THREE.AmbientLight(0x31404a, 0.38));
    const maintenanceLight = new THREE.PointLight(0xe09a58, 2.1, 26);
    maintenanceLight.position.set(0, 3.8, 2);
    this.scene.add(maintenanceLight);
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
    byId.short.enabled = snapshot.beat === 'maintenance' && snapshot.repairStep === 0;
    byId.joint.enabled = snapshot.beat === 'maintenance' && snapshot.repairStep === 1;
    byId.valve.enabled = snapshot.beat === 'maintenance' && snapshot.repairStep === 2;
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

  update(delta) {
    this.elapsed += delta;
    const pulse = 0.72 + Math.sin(this.elapsed * 8.5) * 0.28;
    this.deployment.handles.arc.material.opacity = pulse;
    this.deployment.handles.fracture.rotation.z = Math.sin(this.elapsed * 2.2) * 0.025;
    this.deployment.handles.stars.position.x = Math.sin(this.elapsed * 0.025) * 0.7;
    this.maintenance.root.position.x = Math.sin(this.elapsed * 0.7) * 0.003;
  }
}
