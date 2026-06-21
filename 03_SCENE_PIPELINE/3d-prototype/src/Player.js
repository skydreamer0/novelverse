import * as THREE from 'three';
import { PlayerAvatar } from './PlayerAvatar.js';
import { ThirdPersonCamera } from './ThirdPersonCamera.js';

export class Player {
  constructor(camera, scene) {
    this.avatar = new PlayerAvatar(scene);
    this.tpCamera = new ThirdPersonCamera(camera);
    
    // Initial position
    this.avatar.setPosition(0, 0, 0); 
    
    this.velocity = new THREE.Vector3();
    
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    
    this.speed = 10.0;
    this.turnSpeed = 10.0; // Lerp speed for character rotation
    
    this.initInput();
  }

  initInput() {
    const onKeyDown = (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': this.moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': this.moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': this.moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': this.moveRight = true; break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': this.moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': this.moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': this.moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': this.moveRight = false; break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  getPosition() {
    return this.avatar.getPosition();
  }

  update(delta) {
    // 1. Calculate movement direction based on camera orientation
    const moveDir = new THREE.Vector3(0, 0, 0);
    const forward = this.tpCamera.getForwardVector();
    const right = this.tpCamera.getRightVector();

    if (this.moveForward) moveDir.add(forward);
    if (this.moveBackward) moveDir.sub(forward);
    if (this.moveRight) moveDir.add(right);
    if (this.moveLeft) moveDir.sub(right);

    moveDir.normalize();

    // 2. Move Avatar
    if (moveDir.lengthSq() > 0.01) {
      // Calculate target rotation (facing movement direction)
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      
      // Smooth rotation (slerp-like for Y axis)
      let currentAngle = this.avatar.getRotation().y;
      
      // Fix 360 wrap around issue for smooth rotation
      let diff = targetAngle - currentAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      this.avatar.setRotationY(currentAngle + diff * this.turnSpeed * delta);

      // Apply Movement
      const pos = this.avatar.getPosition();
      pos.addScaledVector(moveDir, this.speed * delta);
      
      // Simple bounds
      if (pos.x > 50) pos.x = 50;
      if (pos.x < -50) pos.x = -50;
      if (pos.z > 50) pos.z = 50;
      if (pos.z < -50) pos.z = -50;
      
      this.avatar.setPosition(pos.x, pos.y, pos.z);
    }

    // 3. Update Camera to follow Avatar
    this.tpCamera.update(this.avatar.getPosition());

    // 4. Update Avatar animations
    this.avatar.update(delta);
  }
}
