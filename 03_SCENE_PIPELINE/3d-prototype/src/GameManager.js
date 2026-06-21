import * as THREE from 'three';

export class GameManager {
  constructor(player, world, enemies, uiManager) {
    this.player = player;
    this.world = world;
    this.enemies = enemies;
    this.ui = uiManager;

    this.fragmentsCollected = 0;
    this.totalFragments = 5;
    this.pollution = 0; // 0 to 100
    this.isGameOver = false;

    this.interactionTarget = null;
    this.interactionType = null;

    this.initInteraction();
  }

  initInteraction() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && this.interactionTarget && !this.isGameOver) {
        this.handleInteraction();
      }
    });
  }

  handleInteraction() {
    if (this.interactionType === 'fragment') {
      this.interactionTarget.visible = false;
      this.interactionTarget.userData.collected = true;
      this.fragmentsCollected++;
      this.ui.updateFragments(this.fragmentsCollected, this.totalFragments);
      
      // Update beacon color if all collected
      if (this.fragmentsCollected >= this.totalFragments) {
        this.world.getBeacon().material.color.setHex(0x00ff00);
        this.world.getBeacon().material.emissive.setHex(0x004400);
        this.world.getBeacon().userData.active = true;
      }
    } else if (this.interactionType === 'cleaner') {
      this.pollution = 0;
      this.ui.updatePollution(this.pollution);
    } else if (this.interactionType === 'beacon') {
      if (this.world.getBeacon().userData.active) {
        this.isGameOver = true;
        this.ui.showVictory("航線已鎖定：中立深淵城鎮");
      }
    }
    
    this.interactionTarget = null;
    this.interactionType = null;
    this.ui.hideInteraction();
  }

  update(delta) {
    if (this.isGameOver) return;

    const playerPos = this.player.getPosition();

    // 1. Pollution logic
    // Base pollution rate from fog
    let pollutionRate = 1.0 * delta; 

    // Check distance to enemies (Abyss Creatures spike pollution)
    const monsters = this.enemies.getMonsters();
    for (let m of monsters) {
      const dist = playerPos.distanceTo(m.position);
      if (dist < 10) {
        pollutionRate += (10 - dist) * 2 * delta; // Spike if close
      }
    }

    this.pollution += pollutionRate;
    this.ui.updatePollution(this.pollution);

    if (this.pollution >= 100) {
      this.isGameOver = true;
      this.ui.showGameOver("污染值過高，你已被深淵吞噬。");
      return;
    }

    // 2. Interaction checks
    this.interactionTarget = null;
    this.interactionType = null;
    this.ui.hideInteraction();

    const interactDistance = 4.0;

    // Check fragments
    for (let frag of this.world.getFragments()) {
      if (!frag.userData.collected && playerPos.distanceTo(frag.position) < interactDistance) {
        this.interactionTarget = frag;
        this.interactionType = 'fragment';
        this.ui.showInteraction('按 [E] 收集規則殘片');
        return; // Prioritize one
      }
    }

    // Check cleaner
    const cleaner = this.world.getCleaner();
    if (playerPos.distanceTo(cleaner.position) < interactDistance) {
      this.interactionTarget = cleaner;
      this.interactionType = 'cleaner';
      this.ui.showInteraction('按 [E] 清除規則垢 (降污染)');
      return;
    }

    // Check beacon
    const beacon = this.world.getBeacon();
    if (playerPos.distanceTo(beacon.position) < interactDistance) {
      this.interactionTarget = beacon;
      this.interactionType = 'beacon';
      if (beacon.userData.active) {
        this.ui.showInteraction('按 [E] 啟動導航信標');
      } else {
        this.ui.showInteraction(`信標鎖定中 (${this.fragmentsCollected}/${this.totalFragments} 殘片)`);
        // Cannot actually interact yet, so unset target
        this.interactionTarget = null;
      }
      return;
    }
  }
}
