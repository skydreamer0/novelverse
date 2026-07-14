import * as THREE from 'three';
import { addGratedFloor, addHullRibs, statusLight } from './materials.js';
import { buildExteriorScaleLayers } from './buildExteriorScaleLayers.js';
import { buildFractureWound } from './FractureMaterial.js';

function buildAirlock(materials) {
  const airlock = new THREE.Group();
  airlock.name = 'pressure-airlock';

  const frameMaterial = materials.rib.clone();
  frameMaterial.color.setHex(0x4d595e);
  const darkFrame = materials.hullDark.clone();
  darkFrame.color.setHex(0x101619);

  for (const x of [-4.65, 4.65]) {
    const column = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.2, 1.5), frameMaterial);
    column.position.set(x, 3.65, 0);
    airlock.add(column);
    for (let y = 0.8; y <= 6.8; y += 1.5) {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.18, 1.72), darkFrame);
      brace.position.set(x, y, -0.05);
      airlock.add(brace);
    }
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.85, 1.65), frameMaterial);
  lintel.position.set(0, 7.55, 0);
  const threshold = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.42, 1.9), darkFrame);
  threshold.position.set(0, 0.12, 0);
  airlock.add(lintel, threshold);

  const door = new THREE.Group();
  door.name = 'airlock-door-lift';
  const doorMaterial = materials.hull.clone();
  doorMaterial.color.setHex(0x2b373c);
  for (const x of [-2.12, 2.12]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(4.12, 6.7, 0.72), doorMaterial);
    panel.position.set(x, 3.5, 0.1);
    panel.castShadow = true;
    panel.receiveShadow = true;
    door.add(panel);
    for (let y = 0.9; y <= 6.1; y += 1.3) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.14, 0.16), frameMaterial);
      rib.position.set(x, y, -0.32);
      door.add(rib);
    }
  }
  const centerSeal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 6.45, 0.18), materials.rust);
  centerSeal.position.set(0, 3.48, -0.36);
  door.add(centerSeal);
  airlock.add(door);

  const warningLights = [];
  for (const x of [-4.95, 4.95]) {
    for (let y = 1.25; y <= 6.25; y += 1.25) {
      const light = statusLight((Math.floor(y * 2) + (x > 0 ? 1 : 0)) % 2 ? 0xff5a2e : 0xe3b25f, 1.8);
      light.position.set(x, y, -0.88);
      light.scale.set(0.75, 0.4, 0.65);
      airlock.add(light);
      warningLights.push(light);
    }
  }

  const fogPlanes = [];
  const fogMaterial = new THREE.MeshBasicMaterial({
    color: 0xb8d7dc,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 4; i += 1) {
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 1.4), fogMaterial.clone());
    fog.position.set(0, 0.7 + i * 1.5, -0.65 - i * 0.08);
    airlock.add(fog);
    fogPlanes.push(fog);
  }

  return { root: airlock, door, warningLights, fogPlanes };
}

export function buildDeploymentBelt(materials, { qualityTier = 'high', reducedMotion = false } = {}) {
  const root = new THREE.Group();
  root.name = 'deployment-belt';
  addGratedFloor(root, -125, 48, materials.grate);
  addHullRibs(root, -102, -142, materials.rib, 6);

  const airlock = buildAirlock(materials);
  airlock.root.position.z = -143;
  root.add(airlock.root);

  const carrier = new THREE.Group();
  const carrierBody = new THREE.Mesh(new THREE.BoxGeometry(6, 2.8, 7.5), materials.rust);
  carrierBody.position.y = 1.45;
  carrier.add(carrierBody);
  for (const x of [-2.35, 2.35]) {
    for (const z of [-2.4, 2.4]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 12), materials.hullDark);
      wheel.position.set(x, 0.48, z);
      wheel.rotation.z = Math.PI / 2;
      carrier.add(wheel);
    }
  }
  carrier.position.set(-1.4, 0, -122);
  carrier.rotation.y = 0.08;
  root.add(carrier);

  const control = statusLight(0xff8b39, 2.2);
  control.geometry = new THREE.BoxGeometry(0.8, 0.8, 0.3);
  control.position.set(3.2, 1.25, -140.8);
  root.add(control);

  const exterior = buildExteriorScaleLayers(materials, { qualityTier });
  root.add(exterior.root);

  const fracture = buildFractureWound({ qualityTier, reducedMotion });
  fracture.root.position.set(0, 11.5, -210);
  fracture.root.visible = false;
  exterior.root.add(fracture.root);

  return {
    root,
    interactables: [
      { id: 'airlock', object: control, action: 'open-airlock', label: '開啟氣閘', maxDistance: 3.5, priority: 3, enabled: false },
      { id: 'fracture', object: fracture.root, action: 'enter-fracture', label: '進入裂隙', maxDistance: 7.5, priority: 4, enabled: false },
    ],
    handles: {
      airlock: airlock.root,
      door: airlock.door,
      warningLights: airlock.warningLights,
      pressureFog: airlock.fogPlanes,
      exterior: exterior.root,
      layers: exterior.layers,
      ...exterior.handles,
      fracture: fracture.root,
      fractureWound: fracture,
    },
  };
}
