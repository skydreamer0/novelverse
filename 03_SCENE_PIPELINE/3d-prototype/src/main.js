import * as THREE from 'three';
import { MothershipWorld } from './world/MothershipWorld.js';
import { FirstPersonController } from './core/FirstPersonController.js';
import { InteractionSystem } from './core/InteractionSystem.js';
import { PrologueState } from './core/PrologueState.js';
import { PrologueDirector } from './core/PrologueDirector.js';
import { UIManager } from './UIManager.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a0d);
scene.fog = new THREE.FogExp2(0x10151a, 0.018);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.08, 800);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x8090a0, 0x050608, 0.65));
const key = new THREE.DirectionalLight(0x9eb4c6, 1.1);
key.position.set(20, 35, 15);
scene.add(key);

const world = new MothershipWorld(scene);
const controller = new FirstPersonController(camera, renderer.domElement);
const ui = new UIManager();
const state = new PrologueState();
const director = new PrologueDirector({ state, world, ui, controller });
const interaction = new InteractionSystem(camera, {
  onPrompt: (target) => target ? ui.showInteraction(`[E] ${target.label}`) : ui.hideInteraction(),
  onAction: (action) => director.handleAction(action),
});
interaction.setTargets(world.getInteractables());

const instructions = document.getElementById('instructions');
instructions.addEventListener('click', () => renderer.domElement.requestPointerLock());
document.addEventListener('pointerlockchange', () => {
  instructions.style.display = document.pointerLockElement === renderer.domElement ? 'none' : 'flex';
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  controller.update(delta, document.pointerLockElement === renderer.domElement);
  interaction.update();
  world.update(delta);
  renderer.render(scene, camera);
}
animate();
