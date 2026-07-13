export const QUALITY_PRESETS = Object.freeze({
  low: { pixelRatio: 1, shadows: false, particles: 0.35 },
  medium: { pixelRatio: 1.35, shadows: true, particles: 0.65 },
  high: { pixelRatio: 1.75, shadows: true, particles: 1 },
});

export function chooseQualityTier({
  force,
  maxTextureSize = 8192,
  hardwareConcurrency = 8,
  devicePixelRatio = 1,
} = {}) {
  if (Object.hasOwn(QUALITY_PRESETS, force)) return force;
  if (maxTextureSize < 8192 || hardwareConcurrency <= 4 || devicePixelRatio > 2.5) return 'low';
  if (hardwareConcurrency < 8 || devicePixelRatio > 1.75) return 'medium';
  return 'high';
}

export class QualityManager {
  constructor(renderer, { force = null } = {}) {
    this.renderer = renderer;
    const gl = renderer.getContext();
    this.tier = chooseQualityTier({
      force,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      hardwareConcurrency: navigator.hardwareConcurrency ?? 4,
      devicePixelRatio: window.devicePixelRatio ?? 1,
    });
    this.preset = QUALITY_PRESETS[this.tier];
  }

  apply() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.preset.pixelRatio));
    this.renderer.shadowMap.enabled = this.preset.shadows;
    document.documentElement.dataset.quality = this.tier;
    return this.preset;
  }
}
