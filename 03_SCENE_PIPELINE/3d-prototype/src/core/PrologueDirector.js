import { BEATS } from './PrologueState.js';

const LIMITS = Object.freeze({
  [BEATS.MAINTENANCE]: -12,
  [BEATS.TERMINAL]: -58,
  [BEATS.BLACK_MARKET]: -100,
  [BEATS.DEPLOYMENT]: -142,
  [BEATS.REVEAL]: -205,
  [BEATS.COMPLETE]: -205,
});

const SUBTITLES = Object.freeze({
  'locate-short': '火花在裂開的護套裡跳動。先穩住呼吸。',
  'secure-joint': '臨時接頭咬住導線，氧循環仍在掉壓。',
  'pull-valve': '紅燈轉黃，再轉綠。今晚這一排還能呼吸。',
  'scan-wristband': '這不是催繳，是處決。',
  'open-airlock': '外環壓力平衡。母艦的影子在門後展開。',
  'enter-fracture': '胸口的金屬薄片燙得像一小塊烙鐵。',
  'maintenance-complete': '紅燈轉黃，再轉綠。今晚這一排還能呼吸。',
});

export class PrologueDirector {
  constructor({ state, world, ui, controller, audio = null }) {
    this.state = state;
    this.world = world;
    this.ui = ui;
    this.controller = controller;
    this.audio = audio;
    this.busy = false;
    this.#sync(state.snapshot());
  }

  handleAction(action, payload = {}) {
    if (this.busy) return { ok: false, reason: 'transition-busy' };
    if (action === 'choose-bargain' && !payload.choice) {
      this.ui.showBargain?.((choice) => this.handleAction('choose-bargain', { choice }));
      return { ok: true, pendingChoice: true };
    }

    this.busy = true;
    const result = this.state.apply(action, payload);
    if (result.ok) {
      this.#sync(result.state);
      this.audio?.signal?.(action);
      if (SUBTITLES[action]) this.ui.showSubtitle?.(SUBTITLES[action]);
      if (action === 'scan-wristband') this.ui.showTerminal?.(result.state);
      if (action === 'enter-fracture') this.ui.showEnding?.(result.state);
    } else {
      this.ui.showSubtitle?.(result.reason);
    }
    this.busy = false;
    return result;
  }

  completeMaintenance(snapshot) {
    if (this.busy) return { ok: false, reason: 'transition-busy' };
    this.busy = true;
    const result = this.state.apply('complete-maintenance', snapshot);
    if (result.ok) {
      this.#sync(result.state);
      this.audio?.signal?.('maintenance-complete');
      this.ui.showSubtitle?.(SUBTITLES['maintenance-complete']);
    } else {
      this.ui.showSubtitle?.(result.reason);
    }
    this.busy = false;
    return result;
  }

  #sync(snapshot) {
    this.world.setProgress(snapshot);
    this.ui.renderState?.(snapshot);
    this.controller.setLegLoad(snapshot.legLoad);
    this.controller.setBounds({ minZ: LIMITS[snapshot.beat] });
  }
}
