const repair = [
  { action: 'locate-short' },
  { action: 'secure-joint' },
  { action: 'pull-valve' },
];
const audit = [...repair, { action: 'scan-wristband' }];
const accepted = [...audit, { action: 'choose-bargain', payload: { choice: 'intel' } }];
const revealed = [...accepted, { action: 'open-airlock' }];

const PRESETS = Object.freeze({
  terminal: { events: audit, position: [0, 1.65, -44], yaw: -0.35, overlay: 'terminal' },
  market: { events: audit, position: [0, 1.65, -83], yaw: 0.2, overlay: 'bargain' },
  deployment: { events: accepted, position: [0, 1.65, -136], yaw: -0.45, overlay: null },
  reveal: { events: revealed, position: [0, 1.65, -154], yaw: 0, pitch: 0.16, overlay: null },
  ending: { events: [...revealed, { action: 'enter-fracture' }], position: [0, 1.65, -186], yaw: 0, overlay: 'ending' },
});

export function qaScenePreset(name) {
  return PRESETS[name] ?? null;
}

export function applyQaScene(name, { director, controller, ui }) {
  const preset = qaScenePreset(name);
  if (!preset) return false;

  for (const event of preset.events) director.handleAction(event.action, event.payload);
  controller.position.set(...preset.position);
  controller.yaw = preset.yaw;
  controller.pitch = preset.pitch ?? 0;
  controller.enableFallbackLook(true);

  if (preset.overlay !== 'terminal') ui.terminal.hidden = true;
  if (preset.overlay === 'bargain') director.handleAction('choose-bargain');
  if (preset.overlay !== 'bargain') ui.bargain.hidden = true;
  document.getElementById('instructions').style.display = 'none';
  return true;
}
