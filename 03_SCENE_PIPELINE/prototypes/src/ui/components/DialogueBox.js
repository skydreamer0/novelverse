import { bus } from '../../core/EventBus.js';

export class DialogueBox {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.speakerName = document.createElement('div');
    this.dialogueText = document.createElement('div');
    this.typewriterInterval = null;

    this.initDOM();
    bus.on('scene:node_changed', this.handleNodeChange.bind(this));
  }

  initDOM() {
    this.container.style.position = 'absolute';
    this.container.style.bottom = '2rem';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.width = '90%';
    this.container.style.maxWidth = '1000px';
    this.container.style.minHeight = '200px';
    
    // Glassmorphism styles
    this.container.style.background = 'var(--glass-bg)';
    this.container.style.backdropFilter = 'blur(12px)';
    this.container.style.border = '1px solid var(--glass-border)';
    this.container.style.borderRadius = '16px';
    this.container.style.boxShadow = 'var(--glass-shadow)';
    this.container.style.padding = '2rem';
    this.container.style.boxSizing = 'border-box';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.zIndex = '10';
    this.container.style.transition = 'opacity 0.3s ease';

    // Speaker Name
    this.speakerName.style.fontWeight = '700';
    this.speakerName.style.fontSize = '1.25rem';
    this.speakerName.style.color = 'var(--accent-color)';
    this.speakerName.style.marginBottom = '0.5rem';
    this.speakerName.style.letterSpacing = '0.05em';
    this.speakerName.style.display = 'none';

    // Dialogue Text
    this.dialogueText.style.fontSize = '1.125rem';
    this.dialogueText.style.lineHeight = '1.7';
    this.dialogueText.style.color = 'var(--text-primary)';
    this.dialogueText.style.flexGrow = '1';

    this.container.appendChild(this.speakerName);
    this.container.appendChild(this.dialogueText);
  }

  handleNodeChange(node) {
    if (node.speaker) {
      this.speakerName.textContent = node.speaker;
      this.speakerName.style.display = 'block';
    } else {
      this.speakerName.style.display = 'none';
    }

    this.typeText(node.text).then(() => {
      bus.emit('dialogue:complete', node);
    });
  }

  typeText(text) {
    return new Promise(resolve => {
      if (this.typewriterInterval) clearInterval(this.typewriterInterval);
      
      this.dialogueText.textContent = '';
      let i = 0;
      
      this.typewriterInterval = setInterval(() => {
        if (i < text.length) {
          this.dialogueText.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(this.typewriterInterval);
          resolve();
        }
      }, 30);
    });
  }
}
