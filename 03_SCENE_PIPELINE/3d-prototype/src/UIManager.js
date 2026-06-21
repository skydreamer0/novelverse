export class UIManager {
  constructor() {
    this.missionText = document.getElementById('mission-text');
    this.pollutionFill = document.getElementById('pollution-bar-fill');
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.endScreen = document.getElementById('end-screen');
    this.endTitle = document.getElementById('end-title');
    this.endMessage = document.getElementById('end-message');
  }

  updateFragments(count, total) {
    this.missionText.innerText = `任務：收集規則殘片 (${count} / ${total})`;
  }

  updatePollution(percentage) {
    const clamped = Math.max(0, Math.min(100, percentage));
    this.pollutionFill.style.width = `${clamped}%`;
  }

  showInteraction(text) {
    this.interactionPrompt.innerText = text;
    this.interactionPrompt.style.display = 'block';
  }

  hideInteraction() {
    this.interactionPrompt.style.display = 'none';
  }

  showGameOver(message) {
    this.endTitle.innerText = "任務失敗";
    this.endTitle.style.color = "#f44336";
    this.endMessage.innerText = message;
    this.endScreen.style.display = 'flex';
    document.exitPointerLock();
  }

  showVictory(message) {
    this.endTitle.innerText = "任務完成";
    this.endTitle.style.color = "#4caf50";
    this.endMessage.innerText = message;
    this.endScreen.style.display = 'flex';
    document.exitPointerLock();
  }
}
