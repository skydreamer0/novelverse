import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.fragments = [];
    
    this.cleanerDevice = null;
    this.beacon = null;

    this.initEnvironment();
    this.initInteractables();
  }

  initEnvironment() {
    // Floor (Invisible or dark plane)
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ark Mother Ship Wall (Background)
    const wallGeo = new THREE.BoxGeometry(100, 50, 5);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 25, -40);
    wall.receiveShadow = true;
    wall.castShadow = true;
    this.scene.add(wall);
    this.colliders.push(wall);

    // Scatter wreckage (Cubes)
    const boxGeo = new THREE.BoxGeometry(2, 2, 2);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    for (let i = 0; i < 30; i++) {
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(
        Math.random() * 80 - 40,
        Math.random() * 2, // Slightly submerged or floating
        Math.random() * 60 - 30
      );
      box.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      
      // Random scale for variety
      const scale = 1 + Math.random() * 2;
      box.scale.set(scale, scale, scale);
      
      box.castShadow = true;
      box.receiveShadow = true;
      this.scene.add(box);
      this.colliders.push(box);
    }
  }

  initInteractables() {
    // 5 Fragments (Glowing Yellow Spheres)
    const fragGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const fragMat = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, 
      emissive: 0x888800,
      roughness: 0.2
    });

    for (let i = 0; i < 5; i++) {
      const frag = new THREE.Mesh(fragGeo, fragMat);
      frag.position.set(
        Math.random() * 60 - 30,
        1,
        Math.random() * 40 - 20
      );
      // Add a small point light to each fragment
      const light = new THREE.PointLight(0xffff00, 1, 5);
      frag.add(light);
      
      frag.userData = { type: 'fragment', collected: false };
      this.scene.add(frag);
      this.fragments.push(frag);
    }

    // Cleaner Device (Blue Cylinder)
    const cleanGeo = new THREE.CylinderGeometry(1, 1, 3, 16);
    const cleanMat = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x002288
    });
    this.cleanerDevice = new THREE.Mesh(cleanGeo, cleanMat);
    this.cleanerDevice.position.set(-20, 1.5, 0);
    this.cleanerDevice.userData = { type: 'cleaner' };
    this.scene.add(this.cleanerDevice);

    // Navigation Beacon (Red Cone)
    const beaconGeo = new THREE.ConeGeometry(1.5, 4, 16);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0x440000
    });
    this.beacon = new THREE.Mesh(beaconGeo, beaconMat);
    this.beacon.position.set(25, 2, 20);
    this.beacon.userData = { type: 'beacon', active: false };
    this.scene.add(this.beacon);
  }

  getColliders() {
    return this.colliders;
  }

  getFragments() {
    return this.fragments;
  }

  getCleaner() {
    return this.cleanerDevice;
  }

  getBeacon() {
    return this.beacon;
  }
}
