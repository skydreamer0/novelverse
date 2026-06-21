import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(camera) {
    this.camera = camera;
    
    // Default angles (spherical coordinates)
    this.theta = Math.PI; // horizontal angle
    this.phi = Math.PI / 2.2; // vertical angle (slightly looking down)
    this.radius = 6; // distance from character
    
    // Sensitivity
    this.sensitivityX = 0.005;
    this.sensitivityY = 0.005;

    this.initMouseControl();
  }

  initMouseControl() {
    // Only rotate if pointer is locked
    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement === document.body) {
        this.theta -= event.movementX * this.sensitivityX;
        this.phi -= event.movementY * this.sensitivityY;

        // Clamp vertical angle to prevent flipping
        this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));
      }
    });
  }

  update(targetPosition) {
    // Calculate new camera position based on spherical coordinates
    const offsetX = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const offsetY = this.radius * Math.cos(this.phi);
    const offsetZ = this.radius * Math.sin(this.phi) * Math.cos(this.theta);

    // Camera target is slightly above the player's feet (e.g., aiming at head/shoulders)
    const lookAtPos = new THREE.Vector3(targetPosition.x, targetPosition.y + 1.5, targetPosition.z);

    this.camera.position.set(
      lookAtPos.x + offsetX,
      lookAtPos.y + offsetY,
      lookAtPos.z + offsetZ
    );

    // Ensure camera doesn't clip through the ground
    if (this.camera.position.y < 0.5) {
      this.camera.position.y = 0.5;
    }

    this.camera.lookAt(lookAtPos);
  }

  // Helper: get the forward vector of the camera (projected on XZ plane)
  getForwardVector() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    return forward;
  }

  // Helper: get the right vector of the camera (projected on XZ plane)
  getRightVector() {
    const right = new THREE.Vector3();
    right.crossVectors(this.getForwardVector(), new THREE.Vector3(0, 1, 0));
    right.normalize();
    return right;
  }
}
