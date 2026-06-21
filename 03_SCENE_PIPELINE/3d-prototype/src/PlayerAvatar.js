import * as THREE from 'three';
import { modelLoader } from './ModelLoader.js';

export class PlayerAvatar {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    
    // Default placeholder group
    this.placeholderGroup = new THREE.Group();
    this.mesh.add(this.placeholderGroup);
    
    this.buildPlaceholder();
    this.scene.add(this.mesh);

    // Animation support (for future)
    this.mixer = null;

    // Async load real GLB model
    this.loadRealModel();
  }

  buildPlaceholder() {
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.7 });
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x8844ff, emissive: 0x331188 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    const bodyGeo = new THREE.CapsuleGeometry(0.4, 1.0, 4, 8);
    const body = new THREE.Mesh(bodyGeo, suitMat);
    body.position.y = 1.0;
    body.castShadow = true;
    this.placeholderGroup.add(body);

    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const head = new THREE.Mesh(headGeo, suitMat);
    head.position.y = 1.8;
    head.castShadow = true;
    this.placeholderGroup.add(head);

    const visorGeo = new THREE.BoxGeometry(0.5, 0.2, 0.3);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.8, 0.25);
    this.placeholderGroup.add(visor);

    const packGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    const backpack = new THREE.Mesh(packGeo, backpackMat);
    backpack.position.set(0, 1.2, -0.35);
    backpack.castShadow = true;
    this.placeholderGroup.add(backpack);

    const bootGeo = new THREE.BoxGeometry(0.4, 0.2, 0.5);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.2, 0.1, 0.05);
    this.placeholderGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.2, 0.1, 0.05);
    this.placeholderGroup.add(rightBoot);

    const bootLight1 = new THREE.PointLight(0x0088ff, 0.5, 2);
    bootLight1.position.set(-0.2, 0.1, 0);
    this.placeholderGroup.add(bootLight1);

    const bootLight2 = new THREE.PointLight(0x0088ff, 0.5, 2);
    bootLight2.position.set(0.2, 0.1, 0);
    this.placeholderGroup.add(bootLight2);
  }

  async loadRealModel() {
    try {
      const gltf = await modelLoader.loadGLTF('/assets/models/player/player.glb');
      const model = gltf.scene;

      // Adjust these parameters based on the actual imported model
      model.scale.set(1, 1, 1);
      model.position.set(0, 0, 0);
      
      // Face the correct direction (adjust if model runs sideways)
      // model.rotation.y = Math.PI; 
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Hide placeholder and add real model
      this.placeholderGroup.visible = false;
      this.mesh.add(model);

      // Setup Animation Mixer
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);
        // Play the first animation by default as a test
        // const action = this.mixer.clipAction(gltf.animations[0]);
        // action.play();
      }

      console.log('GLB model loaded successfully and replaced placeholder.');
    } catch (error) {
      console.warn('GLB not found, using placeholder avatar.', error.message || error);
      // Placeholder remains visible, game continues smoothly
    }
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  getPosition() {
    return this.mesh.position;
  }

  getRotation() {
    return this.mesh.rotation;
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  setRotationY(angle) {
    this.mesh.rotation.y = angle;
  }
}
