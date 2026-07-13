import * as THREE from 'three';
import { addGratedFloor, addHullRibs, statusLight } from './materials.js';

export function buildDeploymentBelt(materials) {
  const root = new THREE.Group();
  root.name = 'deployment-belt';
  addGratedFloor(root, -125, 48, materials.grate);
  addHullRibs(root, -102, -142, materials.rib, 6);

  const airlock = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.35, 10, 32, Math.PI), materials.rib);
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
  const hullStrips = new THREE.Group();
  const exteriorHullMaterial = materials.hull.clone();
  exteriorHullMaterial.color.setHex(0x69777b);
  exteriorHullMaterial.roughness = 0.72;
  const seamMaterial = new THREE.MeshBasicMaterial({ color: 0x526f74, transparent: true, opacity: 0.75 });
  for (let i = -4; i <= 4; i += 1) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.72, 120), exteriorHullMaterial);
    strip.position.set(i * 5.8, 9.5 + Math.abs(i) * 1.45, -174);
    strip.rotation.z = -i * 0.055;
    strip.receiveShadow = true;
    hullStrips.add(strip);

    const longitudinalSeam = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 118), seamMaterial);
    longitudinalSeam.position.set(i * 5.8 + 2.78, 9.1 + Math.abs(i) * 1.45, -174);
    longitudinalSeam.rotation.z = -i * 0.055;
    hullStrips.add(longitudinalSeam);

    for (const z of [-132, -158, -184, -210]) {
      const seam = statusLight((Math.abs(i) + Math.abs(z)) % 5 === 0 ? 0xff4e34 : 0x8dcbd3, 1.7);
      seam.geometry = new THREE.BoxGeometry(0.08, 0.12, 2.2);
      seam.position.set(i * 5.8 + 2.72, 9.08 + Math.abs(i) * 1.45, z);
      seam.rotation.z = -i * 0.055;
      hullStrips.add(seam);
    }
  }
  exterior.add(hullStrips);

  const nearFill = new THREE.PointLight(0x92bdc8, 800, 72, 1.25);
  nearFill.position.set(0, 2.4, -150);
  const farFill = new THREE.PointLight(0x6d91a3, 650, 78, 1.4);
  farFill.position.set(-8, 1.5, -198);
  exterior.add(nearFill, farFill);

  for (const x of [-24, 24]) {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(1.1, 18, 74), materials.hullDark);
    truss.position.set(x, 18, -176);
    truss.rotation.z = x < 0 ? -0.38 : 0.38;
    exterior.add(truss);
  }

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
    handles: { airlock, door, exterior, hullStrips, stars, fracture, arc },
  };
}
