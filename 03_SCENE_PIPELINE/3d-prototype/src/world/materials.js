import * as THREE from 'three';

export function createMaterials() {
  return {
    hull: new THREE.MeshStandardMaterial({ color: 0x343d42, roughness: 0.82, metalness: 0.74 }),
    hullDark: new THREE.MeshStandardMaterial({ color: 0x11171a, roughness: 0.92, metalness: 0.62 }),
    rib: new THREE.MeshStandardMaterial({ color: 0x596166, roughness: 0.7, metalness: 0.8 }),
    rust: new THREE.MeshStandardMaterial({ color: 0x4d2d1d, roughness: 0.94, metalness: 0.48 }),
    pipe: new THREE.MeshStandardMaterial({ color: 0x6b5b43, roughness: 0.78, metalness: 0.7 }),
    pipeCold: new THREE.MeshStandardMaterial({ color: 0x344d58, roughness: 0.68, metalness: 0.74 }),
    grate: new THREE.MeshStandardMaterial({ color: 0x20272a, roughness: 0.88, metalness: 0.84 }),
    auditPaper: new THREE.MeshStandardMaterial({ color: 0x9b8b76, roughness: 1, side: THREE.DoubleSide }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x77999b, transmission: 0.45, transparent: true, opacity: 0.44, roughness: 0.18, metalness: 0 }),
    terminal: new THREE.MeshStandardMaterial({ color: 0x071417, emissive: 0x0b5360, emissiveIntensity: 1.4, roughness: 0.3 }),
    fracture: new THREE.MeshBasicMaterial({ color: 0x000103, side: THREE.DoubleSide }),
    blueArc: new THREE.MeshBasicMaterial({ color: 0xa8eaff, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending }),
    purple: new THREE.MeshStandardMaterial({ color: 0x25182f, emissive: 0x4a175c, emissiveIntensity: 1.4, roughness: 0.48 }),
  };
}

export function addGratedFloor(group, zCenter, length, material) {
  for (let z = zCenter - length / 2; z <= zCenter + length / 2; z += 1.2) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.08, 0.12), material);
    bar.position.set(0, 0, z);
    group.add(bar);
  }
  for (const x of [-4.1, -2, 0, 2, 4.1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, length), material);
    rail.position.set(x, -0.02, zCenter);
    group.add(rail);
  }
}

export function addHullRibs(group, zStart, zEnd, material, spacing = 5) {
  for (let z = zStart; z >= zEnd; z -= spacing) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.18, 8, 28, Math.PI), material);
    rib.rotation.z = Math.PI / 2;
    rib.rotation.y = Math.PI / 2;
    rib.position.set(0, 0.1, z);
    group.add(rib);
  }
}

export function statusLight(color, intensity = 1.6) {
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });
  return new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.08), mat);
}
