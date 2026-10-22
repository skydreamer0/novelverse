import * as THREE from 'three';
import { addGratedFloor, addHullRibs, statusLight } from './materials.js';

export function buildTerminalCorridor(materials) {
  const root = new THREE.Group();
  root.name = 'terminal-corridor';
  addGratedFloor(root, -36, 38, materials.grate);
  addHullRibs(root, -17, -55, materials.rib, 5);

  for (let z = -20; z >= -52; z -= 6) {
    for (const x of [-3.6, 3.6]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.6, 5.8), materials.hull);
      wall.position.set(x, 2.6, z);
      wall.rotation.z = x < 0 ? -0.08 : 0.08;
      root.add(wall);
    }
    const tube = statusLight(z % 12 === 0 ? 0x1b2020 : 0xe0aa61, z % 12 === 0 ? 0.05 : 1.7);
    tube.geometry = new THREE.BoxGeometry(2.8, 0.08, 0.16);
    tube.position.set(0, 4.55, z);
    root.add(tube);
  }

  for (let i = 0; i < 24; i += 1) {
    const seal = new THREE.Mesh(new THREE.PlaneGeometry(0.7 + (i % 3) * 0.2, 0.24), materials.auditPaper);
    seal.position.set(i % 2 ? 3.39 : -3.39, 0.7 + (i % 7) * 0.48, -22 - (i % 10) * 3);
    seal.rotation.y = i % 2 ? -Math.PI / 2 : Math.PI / 2;
    seal.rotation.z = (i % 5 - 2) * 0.04;
    root.add(seal);
  }

  const terminalBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.1, 0.8), materials.hullDark);
  terminalBody.position.set(2.45, 1.55, -48);
  terminalBody.rotation.y = -0.42;
  root.add(terminalBody);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.25), materials.terminal);
  screen.position.set(2.08, 1.8, -47.59);
  screen.rotation.y = -0.42;
  root.add(screen);

  for (let i = 0; i < 9; i += 1) {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.05, 4, 8), materials.hullDark);
    body.position.set((i % 3 - 1) * 1.1, 0.85, -38 - Math.floor(i / 3) * 1.6);
    body.rotation.x = -0.06;
    root.add(body);
  }

  return {
    root,
    interactables: [{ id: 'terminal', object: screen, action: 'scan-wristband', label: '掃描磨損腕環', maxDistance: 3.5, priority: 3, enabled: false }],
    handles: { screen },
  };
}
