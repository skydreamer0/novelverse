import * as THREE from 'three';
import { addGratedFloor, addHullRibs, statusLight } from './materials.js';

export function buildMaintenanceBay(materials) {
  const root = new THREE.Group();
  root.name = 'maintenance-bay';
  addGratedFloor(root, 0, 24, materials.grate);
  addHullRibs(root, 10, -12, materials.rib, 4);

  const abyss = new THREE.Mesh(new THREE.BoxGeometry(9, 18, 25), new THREE.MeshBasicMaterial({ color: 0x010203 }));
  abyss.position.set(0, -9.3, 0);
  root.add(abyss);

  const pipeLanes = [-4.35, -3.7, -3.05, -2.45, 2.45, 3.05, 3.7, 4.35];
  for (let i = 0; i < 16; i += 1) {
    const radius = i % 3 === 0 ? 0.38 : 0.18;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 24, 10), i % 2 ? materials.pipe : materials.pipeCold);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(pipeLanes[i % pipeLanes.length], 1.05 + Math.floor(i / pipeLanes.length) * 2.45, -1);
    root.add(pipe);
  }

  const slot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 0.7), materials.rust);
  slot.position.set(0, 1.35, -6.5);
  root.add(slot);

  const short = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), statusLight(0xff5f28).material);
  short.position.set(1.7, 1.6, -2.8);
  root.add(short);
  const joint = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.8, 12), materials.pipeCold);
  joint.rotation.z = Math.PI / 2;
  joint.position.set(0.75, 1.1, -5.9);
  root.add(joint);
  const valve = new THREE.Group();
  const valveStem = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), materials.rust);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 0.16), materials.rust);
  handle.position.y = 0.52;
  valve.add(valveStem, handle);
  valve.position.set(-1.3, 1.1, -6.05);
  root.add(valve);

  const lights = [0xff382f, 0xe7a82b, 0x51df7b].map((color, index) => {
    const light = statusLight(color, index === 0 ? 2.3 : 0.15);
    light.position.set(-0.45 + index * 0.45, 2.1, -6.13);
    root.add(light);
    return light;
  });

  return {
    root,
    interactables: [
      { id: 'short', object: short, action: 'locate-short', label: '定位短路火花', maxDistance: 3.2, priority: 2 },
      { id: 'joint', object: joint, action: 'secure-joint', label: '固定臨時接頭', maxDistance: 3.2, priority: 2, enabled: false },
      { id: 'valve', object: valve, action: 'pull-valve', label: '拉下備援閥', maxDistance: 3.2, priority: 2, enabled: false },
    ],
    handles: { valve, lights },
  };
}
