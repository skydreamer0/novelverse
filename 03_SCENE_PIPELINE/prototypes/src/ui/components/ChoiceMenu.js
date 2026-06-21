import { bus } from '../../core/EventBus.js';
import { sceneParser } from '../../core/SceneParser.js';

export class ChoiceMenu {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.initDOM();

    // Only show choices after dialogue text is fully rendered
    bus.on('dialogue:complete', this.handleDialogueComplete.bind(this));
    // Clear choices when node changes
    bus.on('scene:node_changed', () => {
      this.container.innerHTML = '';
    });
  }

  initDOM() {
    this.container.style.position = 'absolute';
    this.container.style.top = '50%';
    this.container.style.left = '50%';
    this.container.style.transform = 'translate(-50%, -50%)';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '1rem';
    this.container.style.zIndex = '20';
    this.container.style.width = '80%';
    this.container.style.maxWidth = '600px';
  }

  handleDialogueComplete(node) {
    if (node.choices && node.choices.length > 0) {
      node.choices.forEach(choice => {
        const btn = document.createElement('button');
        
        // CSS via JS styling for encapsulation (or via class in global.css)
        btn.className = 'choice-btn fade-in';
        btn.style.background = 'var(--glass-bg)';
        btn.style.backdropFilter = 'blur(8px)';
        btn.style.border = '1px solid var(--glass-border)';
        btn.style.color = 'var(--text-primary)';
        btn.style.padding = '1rem 1.5rem';
        btn.style.fontSize = '1.1rem';
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'all 0.2s ease';
        btn.style.fontFamily = 'var(--font-family)';
        btn.style.textAlign = 'center';

        btn.onmouseover = () => {
          btn.style.background = 'rgba(255, 255, 255, 0.1)';
          btn.style.borderColor = 'var(--accent-color)';
          btn.style.transform = 'translateY(-2px)';
          btn.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.2)';
        };
        btn.onmouseout = () => {
          btn.style.background = 'var(--glass-bg)';
          btn.style.borderColor = 'var(--glass-border)';
          btn.style.transform = 'none';
          btn.style.boxShadow = 'none';
        };

        btn.textContent = choice.label;
        btn.onclick = () => {
          this.container.innerHTML = '';
          sceneParser.handleChoice(choice);
        };
        this.container.appendChild(btn);
      });
    }
  }
}
