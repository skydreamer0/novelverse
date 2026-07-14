export const AUDIO_SIGNALS = Object.freeze({
  'locate-short': { frequency: 980, end: 1450, duration: 0.18, gain: 0.045, type: 'sawtooth' },
  'secure-joint': { frequency: 170, end: 95, duration: 0.28, gain: 0.07, type: 'square' },
  'pull-valve': { frequency: 72, end: 46, duration: 0.7, gain: 0.11, type: 'sawtooth' },
  'scan-wristband': { frequency: 620, end: 820, duration: 0.22, gain: 0.05, type: 'sine' },
  'choose-bargain': { frequency: 230, end: 180, duration: 0.25, gain: 0.04, type: 'triangle' },
  'open-airlock': { frequency: 54, end: 31, duration: 2.2, gain: 0.15, type: 'sawtooth' },
  'enter-fracture': { frequency: 1640, end: 74, duration: 2.4, gain: 0.12, type: 'sine' },
  'probe-pulse': { frequency: 720, end: 1280, duration: 0.12, gain: 0.038, type: 'square' },
  'wrong-cable': { frequency: 310, end: 86, duration: 0.34, gain: 0.085, type: 'sawtooth' },
  'breaker-trip': { frequency: 88, end: 32, duration: 0.46, gain: 0.13, type: 'square' },
  'stable-weld': { frequency: 460, end: 690, duration: 0.26, gain: 0.045, type: 'triangle' },
  'weld-overheat': { frequency: 1120, end: 94, duration: 0.55, gain: 0.095, type: 'sawtooth' },
  'valve-strain': { frequency: 68, end: 43, duration: 0.62, gain: 0.09, type: 'sawtooth' },
  'valve-slip': { frequency: 130, end: 52, duration: 0.42, gain: 0.11, type: 'square' },
  'maintenance-complete': { frequency: 180, end: 860, duration: 0.72, gain: 0.07, type: 'triangle' },
  'airlock-depressurize': { frequency: 76, end: 28, duration: 1.8, gain: 0.13, type: 'sawtooth' },
  'd9-power-echo': { frequency: 96, end: 440, duration: 1.1, gain: 0.085, type: 'triangle' },
  'spotlight-bend': { frequency: 840, end: 510, duration: 0.48, gain: 0.045, type: 'sine' },
  'fracture-activate': { frequency: 1480, end: 190, duration: 1.7, gain: 0.1, type: 'sine' },
});

export const AUDIO_LOOPS = Object.freeze({
  'electrical-search': { frequency: 188, detune: 7, gain: 0.018, filter: 920, type: 'square' },
  welding: { frequency: 118, detune: 19, gain: 0.028, filter: 1480, type: 'sawtooth' },
  pressure: { frequency: 48, detune: -5, gain: 0.035, filter: 380, type: 'sawtooth' },
  breathing: { frequency: 34, detune: 0, gain: 0.024, filter: 210, type: 'sine' },
  'hull-groan': { frequency: 27, detune: -12, gain: 0.034, filter: 160, type: 'triangle' },
  'fracture-whine': { frequency: 730, detune: 11, gain: 0.022, filter: 1900, type: 'sine' },
});

const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export class AudioDirector {
  constructor() {
    this.context = null;
    this.master = null;
    this.compressor = null;
    this.muted = false;
    this.hum = [];
    this.loops = new Map();
  }

  async activate() {
    if (!this.context) this.#createGraph();
    if (this.context?.state === 'suspended') await this.context.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.context.currentTime, 0.04);
    }
  }

  setLoop(name, intensity = 0, transition = 0.12) {
    const loop = this.loops.get(name);
    const profile = AUDIO_LOOPS[name];
    if (!loop || !profile || !this.context) return false;
    const target = Math.max(0.0001, profile.gain * clamp01(intensity));
    loop.gain.gain.setTargetAtTime(target, this.context.currentTime, Math.max(0.02, transition));
    return true;
  }

  setMaintenanceState(snapshot = {}) {
    this.setLoop('electrical-search', snapshot.phase === 'locate' ? 0.75 : 0);
    this.setLoop('welding', snapshot.phase === 'weld' ? 0.32 + clamp01(snapshot.weldHeat) * 0.68 : 0);
    this.setLoop('pressure', snapshot.phase === 'valve' ? 0.35 + clamp01(snapshot.valveResistance) * 0.5 : 0);
    this.setLoop('breathing', 0.18 + (1 - clamp01((snapshot.oxygen ?? 100) / 100)) * 0.82, 0.28);
  }

  setRevealState(snapshot = {}) {
    this.setLoop('hull-groan', clamp01(snapshot.vacuumMix) * (0.28 + clamp01(snapshot.hullExposure) * 0.72), 0.35);
    this.setLoop('fracture-whine', clamp01(snapshot.fractureIntensity), 0.24);
  }

  async setPaused(paused) {
    if (!this.context) return;
    if (paused && this.context.state === 'running') await this.context.suspend();
    if (!paused && this.context.state === 'suspended') await this.context.resume().catch(() => {});
  }

  signal(action) {
    const profile = AUDIO_SIGNALS[action];
    if (!profile || !this.context || this.muted) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    oscillator.type = profile.type;
    oscillator.frequency.setValueAtTime(profile.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, profile.end), now + profile.duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.max(profile.frequency * 1.4, 180), now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(profile.gain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);
    oscillator.connect(filter).connect(gain).connect(this.compressor ?? this.master);
    oscillator.start(now);
    oscillator.stop(now + profile.duration + 0.03);
  }

  #createGraph() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    this.context = new Context();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.context.destination);

    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -28;
    this.compressor.ratio.value = 6;
    this.compressor.connect(this.master);

    for (const [frequency, volume] of [[31, 0.022], [47, 0.014], [93, 0.006]]) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = frequency === 31 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.value = volume;
      oscillator.connect(gain).connect(this.compressor);
      oscillator.start();
      this.hum.push({ oscillator, gain });
    }

    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain).connect(this.hum[0].gain.gain);
    lfo.start();

    for (const [name, profile] of Object.entries(AUDIO_LOOPS)) {
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      oscillator.type = profile.type;
      oscillator.frequency.value = profile.frequency;
      oscillator.detune.value = profile.detune;
      filter.type = 'lowpass';
      filter.frequency.value = profile.filter;
      gain.gain.value = 0.0001;
      oscillator.connect(filter).connect(gain).connect(this.compressor);
      oscillator.start();
      this.loops.set(name, { oscillator, filter, gain });
    }
  }
}
