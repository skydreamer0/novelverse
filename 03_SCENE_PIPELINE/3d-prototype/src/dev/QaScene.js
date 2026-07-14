const maintenanceResult = Object.freeze({
  complete: true,
  oxygen: 88,
  legLoad: 26,
  repairQuality: 86,
  failureCount: 1,
  elapsed: 184,
});
const repair = [{ action: 'complete-maintenance', payload: maintenanceResult }];
const audit = [...repair, { action: 'scan-wristband' }];
const accepted = [...audit, { action: 'choose-bargain', payload: { choice: 'intel' } }];
const revealed = [...accepted, { action: 'open-airlock' }];

const PRESETS = Object.freeze({
  'maintenance-locate': { events: [], maintenancePhase: 'locate', position: [0, 1.65, -1.5], yaw: 0, overlay: null },
  'maintenance-weld': { events: [], maintenancePhase: 'weld', position: [0, 1.65, -3.2], yaw: 0, overlay: null },
  'maintenance-valve': { events: [], maintenancePhase: 'valve', position: [0, 1.65, -4.2], yaw: 0, overlay: null },
  'maintenance-complete': { events: [], maintenancePhase: 'complete', position: [0, 1.65, -5], yaw: 0, overlay: null },
  terminal: { events: audit, position: [0, 1.65, -44], yaw: -0.35, overlay: 'terminal' },
  market: { events: audit, position: [0, 1.65, -83], yaw: 0.2, overlay: 'bargain' },
  deployment: { events: accepted, position: [0, 1.65, -136], yaw: -0.45, overlay: null },
  reveal: { events: revealed, position: [0, 1.65, -154], yaw: 0, pitch: 0.16, overlay: null },
  ending: { events: [...revealed, { action: 'enter-fracture' }], position: [0, 1.65, -186], yaw: 0, overlay: 'ending' },
});

export function qaScenePreset(name) {
  return PRESETS[name] ?? null;
}

export function applyQaScene(name, { director, controller, ui, maintenanceRuntime = null }) {
  const preset = qaScenePreset(name);
  if (!preset) return false;

  for (const event of preset.events) director.handleAction(event.action, event.payload);
  if (preset.maintenancePhase) maintenanceRuntime?.prepareQaPhase?.(preset.maintenancePhase);
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
