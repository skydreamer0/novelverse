import { bus } from '../../core/EventBus.js';

export class TableauRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.initStyles();
    
    // Subscribe to scene changes
    bus.on('scene:node_changed', this.handleNodeChange.bind(this));
  }

  initStyles() {
    this.container.style.flexGrow = '1';
    this.container.style.position = 'relative';
    this.container.style.backgroundSize = 'cover';
    this.container.style.backgroundPosition = 'center';
    this.container.style.transition = 'background-image 1s ease-in-out';
    
    // Gradient overlay for better text readability
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.bottom = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.height = '50%';
    overlay.style.background = 'linear-gradient(to top, rgba(15,17,21,1) 0%, rgba(15,17,21,0) 100%)';
    overlay.style.pointerEvents = 'none';
    this.container.appendChild(overlay);
  }

  handleNodeChange(node) {
    if (node.visuals && node.visuals.background) {
      this.container.style.backgroundImage = `url('${node.visuals.background}')`;
    }
  }
}
