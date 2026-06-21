import * as THREE from 'three';
import { Player } from './Player.js';
import { World } from './World.js';
import { UIManager } from './UIManager.js';
import { GameManager } from './GameManager.js';
import { Enemies } from './Enemies.js';

// Setup Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
// Deep purple-black fog for the Abyss
scene.fog = new THREE.FogExp2(0x1a0a2a, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0x666699, 1.5); // Bluish light from Ark ship
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
scene.add(dirLight);

// Core Modules
const uiManager = new UIManager();
const player = new Player(camera, scene);
const world = new World(scene);
const enemies = new Enemies(scene);
const gameManager = new GameManager(player, world, enemies, uiManager);

// Handle Window Resize
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Custom Pointer Lock for Third Person
let isLocked = false;
const instructions = document.getElementById('instructions');

instructions.addEventListener('click', () => {
  document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === document.body) {
    isLocked = true;
    instructions.style.display = 'none';
  } else {
    isLocked = false;
    if (!gameManager.isGameOver) {
      instructions.style.display = 'flex';
    }
  }
});

// Game Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (isLocked && !gameManager.isGameOver) {
    player.update(delta); // Third person update
    enemies.update(delta, player.getPosition());
    gameManager.update(delta);
  }

  renderer.render(scene, camera);
}

animate();
