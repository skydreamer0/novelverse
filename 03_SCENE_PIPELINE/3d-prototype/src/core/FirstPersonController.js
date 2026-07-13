import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

export class FirstPersonController {
  constructor(camera, domElement, { start = new THREE.Vector3(0, 1.65, 8) } = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.position = start.clone();
    this.velocity = new THREE.Vector3();
    this.keys = new Set();
    this.yaw = Math.PI;
    this.pitch = 0;
    this.speed = 4.2;
    this.legLoad = 0;
    this.elapsed = 0;
    this.bounds = { minX: -5, maxX: 5, minZ: -220, maxZ: 12 };

    this.onKeyDown = (event) => this.keys.add(event.code);
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onMouseMove = (event) => {
      if (document.pointerLockElement !== this.domElement) return;
      this.yaw -= event.movementX * 0.0022;
      this.pitch = THREE.MathUtils.clamp(this.pitch - event.movementY * 0.0018, -1.25, 1.25);
    };
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    this.camera.position.copy(this.position);
  }

  setLegLoad(value) {
    this.legLoad = THREE.MathUtils.clamp(value, 0, 100);
  }

  setBounds(bounds) {
    this.bounds = { ...this.bounds, ...bounds };
  }

  update(delta, canMove = true) {
    const dt = Math.min(delta, 0.05);
    const input = new THREE.Vector3();
    if (canMove && (this.keys.has('KeyW') || this.keys.has('ArrowUp'))) input.z -= 1;
    if (canMove && (this.keys.has('KeyS') || this.keys.has('ArrowDown'))) input.z += 1;
    if (canMove && (this.keys.has('KeyA') || this.keys.has('ArrowLeft'))) input.x -= 1;
    if (canMove && (this.keys.has('KeyD') || this.keys.has('ArrowRight'))) input.x += 1;

    if (input.lengthSq()) {
      input.normalize().applyAxisAngle(UP, this.yaw);
      const limp = 1 - this.legLoad * 0.0035;
      this.velocity.lerp(input.multiplyScalar(this.speed * limp), 0.22);
      this.elapsed += dt * this.speed;
    } else {
      this.velocity.multiplyScalar(0.76);
    }

    this.position.addScaledVector(this.velocity, dt);
    this.position.x = THREE.MathUtils.clamp(this.position.x, this.bounds.minX, this.bounds.maxX);
    this.position.z = THREE.MathUtils.clamp(this.position.z, this.bounds.minZ, this.bounds.maxZ);
    const bob = input.lengthSq() ? Math.sin(this.elapsed * 7) * 0.018 : 0;
    const limpTilt = input.lengthSq() ? Math.max(0, this.legLoad - 20) * 0.0007 * Math.sin(this.elapsed * 3.5) : 0;
    this.camera.position.set(this.position.x, this.position.y + bob, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(this.pitch, this.yaw, limpTilt);
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
  }
}
