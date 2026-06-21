import * as THREE from 'three';

export class Enemies {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
    
    this.initEnemies();
  }

  initEnemies() {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0x550000,
      wireframe: true
    });

    // Spawn 3 abyss creatures
    for (let i = 0; i < 3; i++) {
      const monster = new THREE.Mesh(geo, mat);
      // Spawn somewhat far away
      monster.position.set(
        Math.random() * 80 - 40,
        2,
        Math.random() * 80 - 40
      );
      this.scene.add(monster);
      this.monsters.push(monster);
    }
  }

  update(delta, playerPos) {
    const speed = 2.0;
    
    this.monsters.forEach(m => {
      // Slowly rotate
      m.rotation.x += delta;
      m.rotation.y += delta;

      // Move towards player
      const dir = new THREE.Vector3().subVectors(playerPos, m.position);
      // Keep them at y=2
      dir.y = 0;
      
      // If player is far, move towards them. If very close, stop or wiggle.
      if (dir.length() > 2) {
        dir.normalize();
        m.position.addScaledVector(dir, speed * delta);
      }
    });
  }

  getMonsters() {
    return this.monsters;
  }
}
