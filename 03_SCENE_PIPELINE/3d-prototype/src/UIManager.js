export const UI_COPY = Object.freeze({
  resident: '居民編號：D9-4417，林燼',
  audit: ['歷史欠額：二十七點', '新增戰備附加稅：九點', '最低生存貢獻需求：四十點', '限期：七十二小時'],
  threat: '未達標將收回氧氣配額與居住權，轉入回收序列。',
  objectives: {
    maintenance: '恢復第九段氧循環',
    terminal: '前往公共終端簽核工分',
    'black-market': '到廢棄減壓艙找蘇嵐',
    deployment: '前往第七投放帶集合',
    reveal: '穿過外環格柵，接近裂縫',
    complete: '裂縫進場完成',
  },
  sectors: {
    maintenance: 'D9／配電槽後方',
    terminal: 'D9／公共終端走廊',
    'black-market': 'D9-D8／廢棄減壓艙',
    deployment: '第七投放帶／內環氣密區',
    reveal: '第七投放帶／母艦外環',
    complete: '裂縫邊界',
  },
});

export class UIManager {
  constructor({ onResume = () => {}, onMute = () => {} } = {}) {
    this.onResume = onResume;
    this.onMute = onMute;
    this.prompt = document.getElementById('interaction-prompt');
    this.subtitle = document.getElementById('subtitle');
    this.wristband = document.getElementById('wristband');
    this.oxygen = document.getElementById('oxygen-value');
    this.leg = document.getElementById('leg-value');
    this.debt = document.getElementById('debt-value');
    this.deadline = document.getElementById('deadline-value');
    this.debtCell = document.getElementById('debt-cell');
    this.deadlineCell = document.getElementById('deadline-cell');
    this.objective = document.getElementById('objective-text');
    this.sector = document.getElementById('sector-name');
    this.terminal = document.getElementById('terminal-overlay');
    this.bargain = document.getElementById('bargain-overlay');
    this.ending = document.getElementById('end-screen');
    this.subtitleTimer = null;

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        this.wristband.classList.toggle('is-collapsed');
      }
    });
    document.getElementById('terminal-close').addEventListener('click', () => {
      this.terminal.hidden = true;
      this.onResume();
    });
    this.#bindToggle('contrast-toggle', 'high-contrast');
    this.#bindToggle('motion-toggle', 'reduced-motion');
    document.getElementById('audio-toggle').addEventListener('click', (event) => {
      const active = event.currentTarget.getAttribute('aria-pressed') !== 'true';
      event.currentTarget.setAttribute('aria-pressed', String(active));
      this.onMute(active);
    });
  }

  renderState(state) {
    this.oxygen.textContent = String(Math.round(state.oxygen));
    this.leg.textContent = String(Math.round(state.legLoad));
    this.debt.textContent = state.deadlineHours == null ? '--' : String(state.debt);
    this.deadline.textContent = state.deadlineHours == null ? '--' : String(state.deadlineHours);
    this.debtCell.classList.toggle('is-locked', state.deadlineHours == null);
    this.deadlineCell.classList.toggle('is-locked', state.deadlineHours == null);
    this.objective.textContent = UI_COPY.objectives[state.beat];
    this.sector.textContent = UI_COPY.sectors[state.beat];
  }

  showInteraction(text) {
    this.prompt.textContent = text;
    this.prompt.hidden = false;
  }

  hideInteraction() {
    this.prompt.hidden = true;
  }

  showSubtitle(text) {
    clearTimeout(this.subtitleTimer);
    this.subtitle.textContent = text;
    this.subtitle.hidden = false;
    this.subtitleTimer = setTimeout(() => { this.subtitle.hidden = true; }, 4200);
  }

  showTerminal() {
    this.terminal.hidden = false;
    document.exitPointerLock?.();
    document.getElementById('terminal-close').focus();
  }

  showBargain(choose) {
    this.bargain.hidden = false;
    document.exitPointerLock?.();
    const buttons = [...this.bargain.querySelectorAll('[data-bargain]')];
    buttons.forEach((button) => {
      button.onclick = () => {
        this.bargain.hidden = true;
        choose(button.dataset.bargain);
        this.onResume();
      };
    });
    buttons[0]?.focus();
  }

  showEnding() {
    this.ending.hidden = false;
    document.exitPointerLock?.();
  }

  isModalOpen() {
    return !this.terminal.hidden || !this.bargain.hidden;
  }

  isEnding() {
    return !this.ending.hidden;
  }

  #bindToggle(id, className) {
    document.getElementById(id).addEventListener('click', (event) => {
      const active = event.currentTarget.getAttribute('aria-pressed') !== 'true';
      event.currentTarget.setAttribute('aria-pressed', String(active));
      document.documentElement.classList.toggle(className, active);
    });
  }
}
