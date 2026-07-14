export const REVEAL_PHASES = Object.freeze({
  SEALED: 'sealed',
  DEPRESSURIZING: 'depressurizing',
  SLIT: 'slit',
  HULL_REVEAL: 'hull-reveal',
  POWER_ECHO: 'power-echo',
  FRACTURE_ACTIVE: 'fracture-active',
});

const TIMELINE = Object.freeze({
  depressurizing: 0.8,
  slit: 4.8,
  hull: 7.2,
  power: 12,
  fracture: 17,
});

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const progress = (value, start, end) => clamp01((value - start) / (end - start));
const smooth = (value) => value * value * (3 - 2 * value);

export function shouldTickReveal({
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

export class ScaleRevealDirector {
  constructor() {
    this.active = false;
    this.elapsed = 0;
    this.powerStability = 1;
  }

  start({ repairQuality = 100 } = {}) {
    this.active = true;
    this.elapsed = 0;
    this.powerStability = Number.isFinite(repairQuality) ? clamp01(repairQuality / 100) : 1;
    return this.snapshot();
  }

  update(delta) {
    if (!this.active || !Number.isFinite(delta) || delta <= 0 || delta > 0.25) return this.snapshot();
    this.elapsed += delta;
    return this.snapshot();
  }

  snapshot() {
    const phase = this.#phase();
    const pressureUp = smooth(progress(this.elapsed, TIMELINE.depressurizing, TIMELINE.slit - 1));
    const pressureDown = 1 - smooth(progress(this.elapsed, TIMELINE.slit - 1, TIMELINE.hull));
    const slitProgress = smooth(progress(this.elapsed, TIMELINE.slit, TIMELINE.hull));
    const hullProgress = smooth(progress(this.elapsed, TIMELINE.hull, TIMELINE.power));
    const powerProgress = smooth(progress(this.elapsed, TIMELINE.power, TIMELINE.fracture));
    const fractureProgress = smooth(progress(this.elapsed, TIMELINE.fracture, TIMELINE.fracture + 4));
    const doorOpen = phase === REVEAL_PHASES.SLIT
      ? slitProgress * 0.12
      : phase === REVEAL_PHASES.HULL_REVEAL
        ? 0.12 + hullProgress * 0.88
        : this.elapsed >= TIMELINE.power ? 1 : 0;

    return Object.freeze({
      active: this.active,
      phase,
      elapsed: this.elapsed,
      doorOpen: clamp01(doorOpen),
      pressureFog: clamp01(pressureUp * pressureDown),
      vacuumMix: smooth(progress(this.elapsed, TIMELINE.depressurizing, TIMELINE.hull)),
      hullExposure: hullProgress,
      d9PowerProgress: powerProgress,
      d9PowerVisible: this.elapsed >= TIMELINE.power,
      powerStability: this.powerStability,
      spotlightBend: smooth(progress(this.elapsed, TIMELINE.power + 1.2, TIMELINE.fracture + 1)),
      fractureIntensity: fractureProgress,
      fractureActive: phase === REVEAL_PHASES.FRACTURE_ACTIVE,
      traversalOpen: phase === REVEAL_PHASES.FRACTURE_ACTIVE && doorOpen >= 1,
    });
  }

  #phase() {
    if (this.elapsed < TIMELINE.depressurizing) return REVEAL_PHASES.SEALED;
    if (this.elapsed < TIMELINE.slit) return REVEAL_PHASES.DEPRESSURIZING;
    if (this.elapsed < TIMELINE.hull) return REVEAL_PHASES.SLIT;
    if (this.elapsed < TIMELINE.power) return REVEAL_PHASES.HULL_REVEAL;
    if (this.elapsed < TIMELINE.fracture) return REVEAL_PHASES.POWER_ECHO;
    return REVEAL_PHASES.FRACTURE_ACTIVE;
  }
}
