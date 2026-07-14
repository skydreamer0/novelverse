import * as THREE from 'three';
import { MothershipWorld } from './world/MothershipWorld.js';
import { FirstPersonController, shouldEnableMovement } from './core/FirstPersonController.js';
import { InteractionSystem } from './core/InteractionSystem.js';
import { PrologueState } from './core/PrologueState.js';
import { PrologueDirector } from './core/PrologueDirector.js';
import { UIManager } from './UIManager.js';
import { AudioDirector } from './core/AudioDirector.js';
import { QualityManager } from './core/QualityManager.js';
import { applyQaScene } from './dev/QaScene.js';
import { MaintenanceChallenge } from './core/MaintenanceChallenge.js';
import { MaintenanceInput } from './core/MaintenanceInput.js';
import { MaintenanceRuntime } from './core/MaintenanceRuntime.js';

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
const forcedQuality = new URLSearchParams(location.search).get('quality');
const quality = new QualityManager(renderer, { force: forcedQuality });
quality.apply();

scene.add(new THREE.HemisphereLight(0x8090a0, 0x050608, 0.65));
const key = new THREE.DirectionalLight(0x9eb4c6, 1.1);
key.position.set(20, 35, 15);
scene.add(key);

const world = new MothershipWorld(scene);
const controller = new FirstPersonController(camera, renderer.domElement);
const audio = new AudioDirector();
let fallbackActive = false;
let hasStarted = false;

function enableFallbackControl() {
  fallbackActive = true;
  controller.enableFallbackLook(true);
  document.getElementById('instructions').style.display = 'none';
  ui?.showSubtitle('滑鼠鎖定不可用：按住畫面拖曳視角，WASD 移動。');
}

function requestControl() {
  audio.activate();
  try {
    const request = renderer.domElement.requestPointerLock();
    request?.catch?.(enableFallbackControl);
  } catch {
    enableFallbackControl();
  }
}

const ui = new UIManager({
  onResume: requestControl,
  onMute: (muted) => audio.setMuted(muted),
});
const state = new PrologueState();
const director = new PrologueDirector({ state, world, ui, controller, audio });
const maintenanceChallenge = new MaintenanceChallenge({ targetCable: 'cable-c' });
const maintenanceInput = new MaintenanceInput();
const maintenanceRuntime = new MaintenanceRuntime({
  challenge: maintenanceChallenge,
  input: maintenanceInput,
  ui,
  world,
  director,
  audio,
});
const interaction = new InteractionSystem(camera, {
  onPrompt: (target) => target ? ui.showInteraction(`[E] ${target.label}`) : ui.hideInteraction(),
  onAction: (action, target) => {
    const result = maintenanceRuntime.handleAction(action, target);
    if (!result.handled) director.handleAction(action, target);
  },
});
interaction.setTargets(world.getInteractables());

const instructions = document.getElementById('instructions');
document.getElementById('start-button').addEventListener('click', () => {
  hasStarted = true;
  maintenanceRuntime.start();
  requestControl();
});
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (locked) {
    fallbackActive = false;
    controller.enableFallbackLook(false);
  }
  instructions.style.display = locked || fallbackActive || ui.isModalOpen() || ui.isEnding() ? 'none' : 'grid';
  if (!locked && hasStarted && !ui.isModalOpen() && !ui.isEnding()) {
    instructions.querySelector('.premise').textContent = '遊戲已暫停。點擊下方按鈕返回第九段。';
    document.getElementById('start-button').querySelector('span').textContent = '返回艙底';
  }
});

if (import.meta.env.DEV) {
  const qaScene = new URLSearchParams(location.search).get('qa');
  if (qaScene && applyQaScene(qaScene, { director, controller, ui, maintenanceRuntime })) {
    hasStarted = true;
    fallbackActive = !ui.isModalOpen() && !ui.isEnding();
  }
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const controlsAvailable = document.pointerLockElement === renderer.domElement || fallbackActive;
  maintenanceRuntime.update(delta, {
    hidden: document.hidden,
    modalOpen: ui.isModalOpen() || ui.isEnding(),
    controlsAvailable,
  });
  const canMove = shouldEnableMovement({
    locked: document.pointerLockElement === renderer.domElement,
    fallbackActive,
    modalOpen: ui.isModalOpen(),
    ending: ui.isEnding(),
    maintenanceActive: maintenanceRuntime.suspendsMovement(),
  });
  controller.update(delta, canMove);
  if (maintenanceRuntime.suspendsMovement()) ui.hideInteraction();
  else interaction.update();
  world.update(delta);
  renderer.render(scene, camera);
}
animate();
