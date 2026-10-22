export const MAINTENANCE_PHASES = Object.freeze({
  LOCATE: 'locate',
  WELD: 'weld',
  VALVE: 'valve',
  COMPLETE: 'complete',
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class MaintenanceChallenge {
  constructor({ targetCable = 'cable-c' } = {}) {
    this.targetCable = targetCable;
    this.phase = MAINTENANCE_PHASES.LOCATE;
    this.oxygen = 100;
    this.legLoad = 12;
    this.elapsed = 0;
    this.failureCount = 0;
    this.assistLevel = 0;
    this.weldHeat = 0;
    this.weldProgress = 0;
    this.valveProgress = 0;
    this.valveStrain = 0;
    this.signalStrength = 0;
    this.excludedCables = new Set();
    this.lastSoftFailure = null;
    this.failureNoticeRemaining = 0;
    this.slipCooldown = 0;
    this.repairQuality = 100;
  }

  get complete() {
    return this.phase === MAINTENANCE_PHASES.COMPLETE;
  }

  get weldTarget() {
    return Math.sin(this.elapsed * 0.67) * 0.38;
  }

  get safeWindow() {
    return 0.12 + this.assistLevel * 0.055;
  }

  get valveResistance() {
    return 0.5 + Math.sin(this.elapsed * 2.15) * 0.5;
  }

  get valveSafeThreshold() {
    return 0.62 + this.assistLevel * 0.08;
  }

  updateProbeSignal(id, distance) {
    if (this.phase !== MAINTENANCE_PHASES.LOCATE || typeof id !== 'string' || !id) {
      this.signalStrength = 0;
      return this.signalStrength;
    }

    const range = Number.isFinite(distance) ? clamp(distance, 0, 3.2) : 3.2;
    const proximity = 1 - range / 4;
    const signature = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 3;
    this.signalStrength = id === this.targetCable
      ? clamp(0.68 + proximity * 0.32, 0, 1)
      : clamp(0.12 + signature * 0.07 + proximity * 0.14, 0, 0.48);
    return this.signalStrength;
  }

  probeCable(id) {
    if (this.phase !== MAINTENANCE_PHASES.LOCATE) return this.#reject('wrong-phase');
    if (typeof id !== 'string' || !id) return this.#reject('invalid-cable');
    if (id === this.targetCable) {
      this.phase = MAINTENANCE_PHASES.WELD;
      this.signalStrength = 1;
      this.lastSoftFailure = null;
      this.failureNoticeRemaining = 0;
      return { ok: true, phase: this.phase, state: this.snapshot() };
    }

    this.excludedCables.add(id);
    return this.#softFail('wrong-cable', { oxygen: 4, legLoad: 1 });
  }

  update(delta, input = {}) {
    if (!Number.isFinite(delta) || delta <= 0 || this.complete) {
      return this.#reject(this.complete ? 'already-complete' : 'invalid-delta');
    }

    const dt = Math.min(delta, 0.1);
    this.elapsed += dt;
    this.oxygen = Math.max(18, this.oxygen - dt * 0.065);
    this.slipCooldown = Math.max(0, this.slipCooldown - dt);
    this.failureNoticeRemaining = Math.max(0, this.failureNoticeRemaining - dt);
    if (this.failureNoticeRemaining === 0) this.lastSoftFailure = null;

    if (this.phase === MAINTENANCE_PHASES.WELD) return this.#updateWeld(dt, input);
    if (this.phase === MAINTENANCE_PHASES.VALVE) return this.#updateValve(dt, input);
    return { ok: true, phase: this.phase, state: this.snapshot() };
  }

  snapshot() {
    return Object.freeze({
      phase: this.phase,
      complete: this.complete,
      oxygen: this.oxygen,
      legLoad: this.legLoad,
      elapsed: this.elapsed,
      failureCount: this.failureCount,
      assistLevel: this.assistLevel,
      weldHeat: this.weldHeat,
      weldProgress: this.weldProgress,
      weldTarget: this.weldTarget,
      safeWindow: this.safeWindow,
      valveProgress: this.valveProgress,
      valveResistance: this.valveResistance,
      valveSafeThreshold: this.valveSafeThreshold,
      valveStrain: this.valveStrain,
      signalStrength: this.signalStrength,
      repairQuality: this.repairQuality,
      lastSoftFailure: this.lastSoftFailure,
      excludedCables: Object.freeze([...this.excludedCables]),
    });
  }

  #updateWeld(dt, input) {
    const engaged = input.engaged === true;
    const alignment = Number.isFinite(input.alignment) ? clamp(input.alignment, -1, 1) : 0;
    const aligned = Math.abs(alignment - this.weldTarget) <= this.safeWindow;

    if (engaged) {
      this.weldHeat = clamp(this.weldHeat + dt * (aligned ? 0.0065 : 0.1), 0, 1);
      if (aligned) this.weldProgress = clamp(this.weldProgress + dt * 0.011, 0, 1);
    } else {
      this.weldHeat = clamp(this.weldHeat - dt * 0.12, 0, 1);
      this.weldProgress = clamp(this.weldProgress - dt * 0.004, 0, 1);
    }

    if (this.weldHeat >= 1) {
      this.weldHeat = 0.2;
      this.weldProgress = Math.max(0, this.weldProgress - 0.22);
      return this.#softFail('weld-overheat', { oxygen: 5, legLoad: 2 });
    }

    if (this.weldProgress >= 1) {
      this.phase = MAINTENANCE_PHASES.VALVE;
      this.weldHeat = 0;
      return { ok: true, phaseChanged: true, phase: this.phase, state: this.snapshot() };
    }

    return { ok: true, phase: this.phase, state: this.snapshot() };
  }

  #updateValve(dt, input) {
    const pulling = input.pulling === true;
    const braced = input.braced === true;
    const resistance = this.valveResistance;
    const safeToPull = resistance <= this.valveSafeThreshold;

    if (pulling && safeToPull) {
      const rate = braced ? 0.0105 : 0.0062;
      this.valveProgress = clamp(this.valveProgress + dt * rate * (1.15 - resistance * 0.2), 0, 1);
      this.valveStrain = Math.max(0, this.valveStrain - dt * 0.75);
    } else if (pulling) {
      this.valveStrain = clamp(this.valveStrain + dt * (braced ? 1.05 : 1.65), 0, 1);
    } else {
      this.valveStrain = Math.max(0, this.valveStrain - dt * 0.45);
    }

    if (this.valveStrain >= 1 && this.slipCooldown <= 0) {
      this.slipCooldown = 0.8;
      this.valveStrain = 0.2;
      this.valveProgress = Math.max(0, this.valveProgress - (braced ? 0.055 : 0.08));
      return this.#softFail('valve-slip', { oxygen: 2, legLoad: braced ? 4 : 6 });
    }

    if (this.valveProgress >= 1) {
      this.phase = MAINTENANCE_PHASES.COMPLETE;
      const oxygenCost = 100 - this.oxygen;
      this.repairQuality = clamp(Math.round(
        100 - this.failureCount * 9 - oxygenCost * 0.18 - Math.max(0, this.legLoad - 12) * 0.25,
      ), 1, 100);
      return { ok: true, phaseChanged: true, phase: this.phase, state: this.snapshot() };
    }

    return { ok: true, phase: this.phase, state: this.snapshot() };
  }

  #softFail(softFailure, { oxygen = 0, legLoad = 0 } = {}) {
    this.failureCount += 1;
    this.assistLevel = Math.min(3, Math.floor(this.failureCount / 2));
    this.oxygen = Math.max(18, this.oxygen - oxygen);
    this.legLoad = clamp(this.legLoad + legLoad, 0, 100);
    this.lastSoftFailure = softFailure;
    this.failureNoticeRemaining = 2.6;
    return { ok: false, softFailure, recoverable: true, state: this.snapshot() };
  }

  #reject(reason) {
    return { ok: false, reason, state: this.snapshot() };
  }
}
