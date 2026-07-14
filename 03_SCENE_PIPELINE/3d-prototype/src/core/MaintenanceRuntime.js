import { MAINTENANCE_PHASES } from './MaintenanceChallenge.js';

const MAINTENANCE_ACTIONS = new Set(['probe-cable', 'start-weld', 'start-valve']);

export function shouldTickMaintenance({
  active,
  hidden,
  modalOpen,
  controlsAvailable,
  delta,
}) {
  return active === true
    && hidden !== true
    && modalOpen !== true
    && controlsAvailable === true
    && Number.isFinite(delta)
    && delta > 0
    && delta <= 0.12;
}

export class MaintenanceRuntime {
  constructor({ challenge, input, ui, world, director, audio = null }) {
    this.challenge = challenge;
    this.input = input;
    this.ui = ui;
    this.world = world;
    this.director = director;
    this.audio = audio;
    this.active = false;
    this.completionSent = false;
  }

  start() {
    if (this.challenge.complete) return false;
    this.active = true;
    this.ui.setMaintenanceActive?.(true);
    this.#sync();
    return true;
  }

  handleAction(action, payload = {}) {
    if (!this.active || !MAINTENANCE_ACTIONS.has(action)) return { handled: false, ok: false };

    if (action === 'probe-cable') {
      const cableId = payload.cableId ?? payload.id;
      const result = this.challenge.probeCable(cableId);
      if (result.ok) {
        this.input.setActive(true);
        this.audio?.signal?.('probe-confirmed');
      } else if (result.softFailure) {
        this.audio?.signal?.(result.softFailure);
      }
      this.#sync();
      return { ...result, handled: true };
    }

    const expected = action === 'start-weld' ? MAINTENANCE_PHASES.WELD : MAINTENANCE_PHASES.VALVE;
    if (this.challenge.phase !== expected) return { handled: true, ok: false, reason: 'wrong-phase' };
    this.input.setActive(true);
    this.ui.setMaintenanceActive?.(true);
    return { handled: true, ok: true };
  }

  update(delta, context) {
    if (!shouldTickMaintenance({ active: this.active, delta, ...context })) return this.challenge.snapshot();

    const controls = this.input.update(delta);
    const result = this.challenge.update(delta, controls);
    if (result.softFailure) this.audio?.signal?.(result.softFailure);
    if (result.phaseChanged) this.audio?.signal?.(`maintenance-${this.challenge.phase}`);
    this.#sync();
    this.#finishIfComplete();
    return this.challenge.snapshot();
  }

  suspendsMovement() {
    return this.active
      && this.input.active === true
      && (this.challenge.phase === MAINTENANCE_PHASES.WELD || this.challenge.phase === MAINTENANCE_PHASES.VALVE);
  }

  prepareQaPhase(phase) {
    if (!Object.values(MAINTENANCE_PHASES).includes(phase)) return false;
    if (!this.active) this.start();
    if (phase === MAINTENANCE_PHASES.LOCATE) return true;

    if (this.challenge.phase === MAINTENANCE_PHASES.LOCATE) {
      this.handleAction('probe-cable', { cableId: this.challenge.targetCable });
    }
    if (phase === MAINTENANCE_PHASES.WELD) return true;

    for (let frame = 0; frame < 400 && this.challenge.phase === MAINTENANCE_PHASES.WELD; frame += 1) {
      this.challenge.update(0.1, { engaged: true, alignment: this.challenge.weldTarget });
    }
    this.#sync();
    if (phase === MAINTENANCE_PHASES.VALVE) return this.challenge.phase === MAINTENANCE_PHASES.VALVE;

    for (let frame = 0; frame < 500 && !this.challenge.complete; frame += 1) {
      this.challenge.update(0.1, { pulling: true, braced: true });
    }
    this.#sync();
    this.#finishIfComplete();
    return this.challenge.complete;
  }

  #sync() {
    const snapshot = this.challenge.snapshot();
    this.ui.renderMaintenance?.(snapshot);
    this.world.applyMaintenance?.(snapshot);
  }

  #finishIfComplete() {
    if (!this.challenge.complete || this.completionSent) return;
    this.completionSent = true;
    this.input.setActive(false);
    this.active = false;
    this.ui.setMaintenanceActive?.(false);
    this.director.completeMaintenance(this.challenge.snapshot());
  }
}
