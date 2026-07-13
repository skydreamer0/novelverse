import * as THREE from 'three';
import { addGratedFloor, addHullRibs } from './materials.js';

export function buildBlackMarket(materials) {
  const root = new THREE.Group();
  root.name = 'black-market';
  addGratedFloor(root, -79, 32, materials.grate);
  addHullRibs(root, -62, -96, materials.rib, 5);

  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 5.1, 32, 20, 1, true), materials.hullDark);
  chamber.rotation.x = Math.PI / 2;
  chamber.position.set(0, 3.3, -79);
  root.add(chamber);

  const bar = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 1.4), materials.rust);
  bar.position.set(0, 0.65, -87);
  root.add(bar);
  for (let i = 0; i < 7; i += 1) {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.85, 12), materials.glass);
    jar.position.set(-2.7 + i * 0.9, 1.45, -87);
    root.add(jar);
  }

  for (let x = -3; x <= 3; x += 1.2) {
    const led = new THREE.PointLight(0xb62cff, 0.7, 4.5);
    led.position.set(x, 3.5, -86.6);
    root.add(led);
  }

  const sulan = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.15, 6, 10), materials.hullDark);
  body.position.y = 1;
  const faceGlow = new THREE.PointLight(0x31d9ff, 1.1, 3.2);
  faceGlow.position.set(0.18, 1.65, 0.3);
  sulan.add(body, faceGlow);
  sulan.position.set(-1.3, 0, -88.2);
  root.add(sulan);

  return {
    root,
    interactables: [{ id: 'sulan', object: sulan, action: 'choose-bargain', label: '與蘇嵐談條件', maxDistance: 4, priority: 3, enabled: false }],
    handles: { sulan },
  };
}
