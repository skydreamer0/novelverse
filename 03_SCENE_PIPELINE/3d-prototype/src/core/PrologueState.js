export const BEATS = Object.freeze({
  MAINTENANCE: 'maintenance',
  TERMINAL: 'terminal',
  BLACK_MARKET: 'black-market',
  DEPLOYMENT: 'deployment',
  REVEAL: 'reveal',
  COMPLETE: 'complete',
});

const BARGAINS = new Set(['pay', 'intel', 'medicine']);

export class PrologueState {
  constructor() {
    this.beat = BEATS.MAINTENANCE;
    this.oxygen = 100;
    this.legLoad = 12;
    this.repairStep = 0;
    this.repairQuality = 0;
    this.debt = 0;
    this.deadlineHours = null;
    this.missionAccepted = false;
    this.blackMarketBenefit = null;
    this.airlockOpen = false;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return Object.freeze({
      beat: this.beat,
      oxygen: this.oxygen,
      legLoad: this.legLoad,
      repairStep: this.repairStep,
      repairQuality: this.repairQuality,
      debt: this.debt,
      deadlineHours: this.deadlineHours,
      missionAccepted: this.missionAccepted,
      blackMarketBenefit: this.blackMarketBenefit,
      airlockOpen: this.airlockOpen,
    });
  }

  apply(event, payload = {}) {
    const before = this.snapshot();
    const result = this.#transition(event, payload);
    if (!result.ok) return result;

    const after = this.snapshot();
    for (const listener of this.listeners) listener(after, before, event);
    return { ok: true, state: after };
  }

  #transition(event, payload) {
    if (event === 'debug-skip-maintenance') {
      this.repairStep = 3;
      this.repairQuality = 100;
      this.beat = BEATS.TERMINAL;
      return { ok: true };
    }

    if (event === 'debug-skip-black-market') {
      this.repairStep = 3;
      this.repairQuality = 100;
      this.debt = 40;
      this.deadlineHours = 72;
      this.beat = BEATS.BLACK_MARKET;
      return { ok: true };
    }

    if (this.beat === BEATS.MAINTENANCE) {
      const sequence = ['locate-short', 'secure-joint', 'pull-valve'];
      if (event !== sequence[this.repairStep]) return this.#reject('維修步驟尚未就緒');
      this.repairStep += 1;
      this.oxygen = Math.max(0, this.oxygen - (event === 'secure-joint' ? 6 : 3));
      this.legLoad = Math.min(100, this.legLoad + (event === 'pull-valve' ? 8 : 3));
      this.repairQuality = Math.round((this.repairStep / sequence.length) * 100);
      if (this.repairStep === sequence.length) this.beat = BEATS.TERMINAL;
      return { ok: true };
    }

    if (this.beat === BEATS.TERMINAL && event === 'scan-wristband') {
      this.debt = 40;
      this.deadlineHours = 72;
      this.beat = BEATS.BLACK_MARKET;
      return { ok: true };
    }

    if (this.beat === BEATS.BLACK_MARKET && event === 'choose-bargain') {
      if (!BARGAINS.has(payload.choice)) return this.#reject('無效的談判選項');
      this.blackMarketBenefit = payload.choice;
      this.missionAccepted = true;
      if (payload.choice === 'medicine') this.legLoad = Math.max(0, this.legLoad - 12);
      this.beat = BEATS.DEPLOYMENT;
      return { ok: true };
    }

    if (this.beat === BEATS.DEPLOYMENT && event === 'open-airlock') {
      this.airlockOpen = true;
      this.beat = BEATS.REVEAL;
      return { ok: true };
    }

    if (this.beat === BEATS.REVEAL && event === 'enter-fracture') {
      this.beat = BEATS.COMPLETE;
      return { ok: true };
    }

    return this.#reject('目前無法執行');
  }

  #reject(reason) {
    return { ok: false, reason, state: this.snapshot() };
  }
}
