const CONTROL_CODES = new Set([
  'KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight',
]);

export function mapMaintenanceKeys(keys) {
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  const right = keys.has('KeyD') || keys.has('ArrowRight');
  const action = keys.has('Space');
  return {
    alignmentDelta: Number(right) - Number(left),
    engaged: action,
    pulling: action,
    braced: keys.has('ShiftLeft') || keys.has('ShiftRight'),
  };
}

export class MaintenanceInput {
  constructor({ target = globalThis.document } = {}) {
    this.target = target;
    this.keys = new Set();
    this.active = false;
    this.alignment = 0;
    this.onKeyDown = (event) => {
      if (!this.active || !CONTROL_CODES.has(event.code)) return;
      event.preventDefault?.();
      this.keys.add(event.code);
    };
    this.onKeyUp = (event) => {
      if (!CONTROL_CODES.has(event.code)) return;
      if (this.active) event.preventDefault?.();
      this.keys.delete(event.code);
    };
    this.target?.addEventListener?.('keydown', this.onKeyDown);
    this.target?.addEventListener?.('keyup', this.onKeyUp);
  }

  setActive(active) {
    this.active = active === true;
    if (!this.active) {
      this.keys.clear();
      this.alignment = 0;
    }
  }

  update(delta) {
    if (!this.active) return this.snapshot();
    const dt = Number.isFinite(delta) ? Math.min(Math.max(delta, 0), 0.1) : 0;
    const mapped = mapMaintenanceKeys(this.keys);
    this.alignment = Math.min(1, Math.max(-1, this.alignment + mapped.alignmentDelta * dt * 1.35));
    return this.snapshot();
  }

  snapshot() {
    const mapped = this.active ? mapMaintenanceKeys(this.keys) : mapMaintenanceKeys(new Set());
    return {
      active: this.active,
      alignment: this.alignment,
      engaged: mapped.engaged,
      pulling: mapped.pulling,
      braced: mapped.braced,
    };
  }

  dispose() {
    this.target?.removeEventListener?.('keydown', this.onKeyDown);
    this.target?.removeEventListener?.('keyup', this.onKeyUp);
    this.keys.clear();
  }
}
