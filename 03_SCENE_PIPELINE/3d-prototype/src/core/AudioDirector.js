export const AUDIO_SIGNALS = Object.freeze({
  'locate-short': { frequency: 980, end: 1450, duration: 0.18, gain: 0.045, type: 'sawtooth' },
  'secure-joint': { frequency: 170, end: 95, duration: 0.28, gain: 0.07, type: 'square' },
  'pull-valve': { frequency: 72, end: 46, duration: 0.7, gain: 0.11, type: 'sawtooth' },
  'scan-wristband': { frequency: 620, end: 820, duration: 0.22, gain: 0.05, type: 'sine' },
  'choose-bargain': { frequency: 230, end: 180, duration: 0.25, gain: 0.04, type: 'triangle' },
  'open-airlock': { frequency: 54, end: 31, duration: 2.2, gain: 0.15, type: 'sawtooth' },
  'enter-fracture': { frequency: 1640, end: 74, duration: 2.4, gain: 0.12, type: 'sine' },
});

export class AudioDirector {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.hum = [];
  }

  async activate() {
    if (!this.context) this.#createGraph();
    if (this.context.state === 'suspended') await this.context.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.context.currentTime, 0.04);
    }
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
    oscillator.connect(filter).connect(gain).connect(this.master);
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

    const compressor = this.context.createDynamicsCompressor();
    compressor.threshold.value = -28;
    compressor.ratio.value = 6;
    compressor.connect(this.master);

    for (const [frequency, volume] of [[31, 0.022], [47, 0.014], [93, 0.006]]) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = frequency === 31 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.value = volume;
      oscillator.connect(gain).connect(compressor);
      oscillator.start();
      this.hum.push({ oscillator, gain });
    }

    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain).connect(this.hum[0].gain.gain);
    lfo.start();
  }
}
