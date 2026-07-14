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

  const cableCandidates = ['cable-a', 'cable-b', 'cable-c'].map((id, index) => {
    const cable = new THREE.Group();
    const sheath = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 3.3, 10),
      index === 2 ? materials.pipeCold : materials.pipe,
    );
    sheath.rotation.x = Math.PI / 2;
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.22, 12), materials.rust);
    socket.rotation.x = Math.PI / 2;
    socket.position.z = 1.55;
    const spark = statusLight(index === 2 ? 0xff6f32 : 0xd28b42, index === 2 ? 2.8 : 0.55);
    spark.scale.setScalar(index === 2 ? 0.8 : 0.5);
    spark.position.set(0.1, 0.08, 1.72);
    cable.add(sheath, socket, spark);
    cable.position.set(-1.55 + index * 1.55, 1.25 + (index % 2) * 0.36, -4.1);
    cable.userData.cableId = id;
    root.add(cable);
    return { id, cable, spark };
  });

  const joint = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.8, 12), materials.pipeCold);
  joint.rotation.z = Math.PI / 2;
  joint.position.set(0.75, 1.1, -5.9);
  root.add(joint);
  const weldSeam = statusLight(0xff923d, 0.25);
  weldSeam.geometry = new THREE.BoxGeometry(0.72, 0.08, 0.08);
  weldSeam.position.copy(joint.position).add(new THREE.Vector3(0, 0.18, 0));
  weldSeam.scale.x = 0.25;
  root.add(weldSeam);

  const valve = new THREE.Group();
  const valvePivot = new THREE.Group();
  const valveStem = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), materials.rust);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 0.16), materials.rust);
  handle.position.y = 0.52;
  valvePivot.add(valveStem, handle);
  valve.add(valvePivot);
  valve.position.set(-1.3, 1.1, -6.05);
  root.add(valve);

  const gauge = new THREE.Group();
  const gaugeFace = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), materials.hullDark);
  const gaugeNeedle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.04), materials.auditPaper);
  gaugeNeedle.position.y = 0.15;
  gauge.add(gaugeFace, gaugeNeedle);
  gauge.position.set(-2.2, 1.9, -6.08);
  root.add(gauge);

  const lights = [0xff382f, 0xe7a82b, 0x51df7b].map((color, index) => {
    const light = statusLight(color, index === 0 ? 2.3 : 0.15);
    light.position.set(-0.45 + index * 0.45, 2.1, -6.13);
    root.add(light);
    return light;
  });

  const powerChain = Array.from({ length: 6 }, (_, index) => {
    const light = statusLight(index < 2 ? 0xe7a82b : 0x51df7b, 0.08);
    light.geometry = new THREE.BoxGeometry(0.65, 0.12, 0.16);
    light.position.set(index % 2 ? 3.9 : -3.9, 3.7, -7.5 - index * 2.1);
    root.add(light);
    return light;
  });

  const fanBlades = Array.from({ length: 3 }, (_, index) => {
    const hub = new THREE.Group();
    for (let bladeIndex = 0; bladeIndex < 4; bladeIndex += 1) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.08), materials.hullDark);
      blade.position.y = 0.42;
      blade.rotation.z = bladeIndex * Math.PI / 2;
      hub.add(blade);
    }
    hub.position.set(index % 2 ? 4.15 : -4.15, 2.2 + index * 0.65, -8.5 - index * 3.4);
    root.add(hub);
    return hub;
  });

  const fogMaterial = new THREE.MeshBasicMaterial({ color: 0xc4e6e6, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const fogPlanes = Array.from({ length: 8 }, (_, index) => {
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(2.8 + index * 0.18, 0.55), fogMaterial.clone());
    fog.position.set((index % 2 ? 1 : -1) * (1.1 + (index % 3) * 0.45), 0.5 + index * 0.3, -5.2 - (index % 4));
    fog.rotation.y = (index % 3 - 1) * 0.4;
    root.add(fog);
    return fog;
  });

  return {
    root,
    interactables: [
      ...cableCandidates.map(({ id, cable }) => ({ id, cableId: id, object: cable, action: 'probe-cable', label: '以腕環探測電纜', maxDistance: 3.2, priority: 2 })),
      { id: 'joint', object: joint, action: 'start-weld', label: '接上臨時焊具', maxDistance: 3.2, priority: 2, enabled: false },
      { id: 'valve', object: valve, action: 'start-valve', label: '握住備援閥', maxDistance: 3.2, priority: 2, enabled: false },
    ],
    handles: {
      valve,
      valvePivot,
      gaugeNeedle,
      weldSeam,
      lights,
      cableCandidates: cableCandidates.map(({ cable }) => cable),
      sparkAnchors: cableCandidates.map(({ spark }) => spark),
      powerChain,
      fanBlades,
      fogPlanes,
    },
  };
}
