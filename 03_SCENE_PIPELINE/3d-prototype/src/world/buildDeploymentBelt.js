import * as THREE from 'three';
import { addGratedFloor, addHullRibs, statusLight } from './materials.js';

export function buildDeploymentBelt(materials) {
  const root = new THREE.Group();
  root.name = 'deployment-belt';
  addGratedFloor(root, -125, 48, materials.grate);
  addHullRibs(root, -102, -142, materials.rib, 6);

  const airlock = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.35, 10, 32, Math.PI), materials.rib);
  frame.rotation.z = Math.PI / 2;
  frame.rotation.y = Math.PI / 2;
  const door = new THREE.Mesh(new THREE.BoxGeometry(8.6, 6.5, 0.7), materials.hull);
  door.position.y = 3.1;
  airlock.add(frame, door);
  airlock.position.z = -143;
  root.add(airlock);

  const carrier = new THREE.Mesh(new THREE.BoxGeometry(6, 2.8, 7.5), materials.rust);
  carrier.position.set(-1.4, 1.45, -122);
  carrier.rotation.y = 0.08;
  root.add(carrier);
  for (let i = 0; i < 3; i += 1) {
    const member = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.3, 5, 10), materials.hullDark);
    member.position.set(-2 + i * 2, 1.05, -133 + (i % 2));
    root.add(member);
  }

  const control = statusLight(0xff8b39, 2.2);
  control.geometry = new THREE.BoxGeometry(0.8, 0.8, 0.3);
  control.position.set(3.2, 1.25, -140.8);
  root.add(control);

  const exterior = new THREE.Group();
  addGratedFloor(exterior, -168, 50, materials.grate);
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(42, 42, 90, 48, 1, true, 0, Math.PI * 0.52), materials.hull);
  hull.rotation.z = Math.PI / 2;
  hull.rotation.y = Math.PI / 2;
  hull.position.set(-37, 19, -169);
  exterior.add(hull);

  for (let i = 0; i < 42; i += 1) {
    const light = statusLight(i % 7 === 0 ? 0xff3b26 : 0x8fc7cd, 1.8);
    light.position.set(-7 + (i % 6) * 4.8, 5 + Math.floor(i / 6) * 3, -151 - (i % 9) * 5.5);
    light.scale.set(0.65, 0.65, 0.65);
    exterior.add(light);
  }

  const starsGeo = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 700; i += 1) starPositions.push((Math.random() - 0.5) * 260, Math.random() * 110 - 25, -145 - Math.random() * 180);
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xb7ccdc, size: 0.12, transparent: true, opacity: 0.65 }));
  exterior.add(stars);

  const fracture = new THREE.Group();
  const wound = new THREE.Mesh(new THREE.CircleGeometry(5, 22), materials.fracture);
  wound.scale.x = 0.26;
  const arc = new THREE.Mesh(new THREE.RingGeometry(4.7, 5.3, 22), materials.blueArc);
  arc.scale.x = 0.28;
  fracture.add(wound, arc);
  fracture.position.set(0, 5.2, -190);
  exterior.add(fracture);
  root.add(exterior);

  return {
    root,
    interactables: [
      { id: 'airlock', object: control, action: 'open-airlock', label: '解除外環氣密鎖', maxDistance: 3.5, priority: 3, enabled: false },
      { id: 'fracture', object: fracture, action: 'enter-fracture', label: '踏入裂縫', maxDistance: 5.5, priority: 4, enabled: false },
    ],
    handles: { airlock, door, exterior, stars, fracture, arc },
  };
}
