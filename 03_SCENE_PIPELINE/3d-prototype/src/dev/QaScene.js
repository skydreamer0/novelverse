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

const revealPreset = (revealPhase, revealElapsed, { position = [0, 1.65, -138], pitch = -0.04 } = {}) => ({
  events: revealed,
  position,
  yaw: 0,
  pitch,
  overlay: null,
  revealPhase,
  revealElapsed,
});

const PRESETS = Object.freeze({
  'maintenance-locate': { events: [], maintenancePhase: 'locate', position: [0, 1.65, -1.5], yaw: 0, overlay: null },
  'maintenance-weld': { events: [], maintenancePhase: 'weld', position: [0, 1.65, -3.2], yaw: 0, overlay: null },
  'maintenance-valve': { events: [], maintenancePhase: 'valve', position: [0, 1.65, -4.2], yaw: 0, overlay: null },
  'maintenance-complete': { events: [], maintenancePhase: 'complete', position: [0, 1.65, -5], yaw: 0, overlay: null },
  'maintenance-wrong-cable': { events: [], maintenancePhase: 'locate', maintenanceCondition: 'wrong-cable', position: [0, 1.65, -1.5], yaw: 0, overlay: null },
  'maintenance-overheat': { events: [], maintenancePhase: 'weld', maintenanceCondition: 'weld-overheat', position: [0, 1.65, -3.2], yaw: 0, overlay: null },
  'maintenance-assisted': { events: [], maintenancePhase: 'locate', maintenanceCondition: 'assisted', position: [0, 1.65, -1.5], yaw: 0, overlay: null },
  terminal: { events: audit, position: [0, 1.65, -44], yaw: -0.35, overlay: 'terminal' },
  market: { events: audit, position: [0, 1.65, -83], yaw: 0.2, overlay: 'bargain' },
  deployment: { events: accepted, position: [0, 1.65, -136], yaw: -0.45, overlay: null },
  reveal: revealPreset('fracture-active', 21.5, { position: [0, 1.65, -166], pitch: -0.12 }),
  'reveal-sealed': revealPreset('sealed', 0),
  'reveal-pressure': revealPreset('depressurizing', 2.5),
  'reveal-slit': revealPreset('slit', 5.8),
  'reveal-hull': revealPreset('hull-reveal', 9.5),
  'reveal-d9': revealPreset('power-echo', 14.5, { pitch: -0.1 }),
  'reveal-fracture': revealPreset('fracture-active', 21.5, { position: [0, 1.65, -166], pitch: -0.12 }),
  ending: { events: [...revealed, { action: 'enter-fracture' }], position: [0, 1.65, -186], yaw: 0, overlay: 'ending' },
});

export function qaScenePreset(name) {
  return PRESETS[name] ?? null;
}

export function applyQaScene(name, {
  director,
  controller,
  ui,
  maintenanceRuntime = null,
  revealDirector = null,
}) {
  const preset = qaScenePreset(name);
  if (!preset) return false;

  for (const event of preset.events) director.handleAction(event.action, event.payload);
  if (preset.maintenancePhase) maintenanceRuntime?.prepareQaPhase?.(preset.maintenancePhase);
  if (preset.maintenanceCondition) maintenanceRuntime?.prepareQaCondition?.(preset.maintenanceCondition);
  if (revealDirector?.active && Number.isFinite(preset.revealElapsed)) {
    let remaining = Math.max(0, preset.revealElapsed);
    while (remaining > 0) {
      const step = Math.min(0.1, remaining);
      revealDirector.update(step);
      remaining -= step;
    }
  }
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
