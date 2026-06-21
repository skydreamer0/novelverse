import { bus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { assetLoader } from './AssetLoader.js';

export class SceneParser {
  constructor() {
    this.sceneData = null;
    this.currentNodeId = null;
  }

  async loadScene(url) {
    try {
      const response = await fetch(url);
      this.sceneData = await response.json();
      
      // Initialize state if defined in scene
      if (this.sceneData.stateVariables) {
        stateManager.init(this.sceneData.stateVariables);
      } else {
        stateManager.init();
      }

      // Preload assets
      await assetLoader.preloadSceneAssets(this.sceneData);

      // Start the scene
      if (this.sceneData.nodes && this.sceneData.nodes.length > 0) {
        this.goToNode(this.sceneData.nodes[0].id);
      }
    } catch (err) {
      console.error("Failed to parse scene:", err);
    }
  }

  getNode(id) {
    if (!this.sceneData || !this.sceneData.nodes) return null;
    return this.sceneData.nodes.find(n => n.id === id);
  }

  goToNode(id) {
    this.currentNodeId = id;
    const node = this.getNode(id);
    if (!node) {
      console.warn(`Node ${id} not found.`);
      return;
    }

    const validChoices = this.filterChoices(node.choices);
    const nodeToRender = { ...node, choices: validChoices };
    
    // Emit event to UI layer instead of direct DOM manipulation
    bus.emit('scene:node_changed', nodeToRender);
  }

  filterChoices(choices) {
    if (!choices) return [];
    return choices.filter(choice => {
      if (!choice.requires || choice.requires.length === 0) return true;
      return choice.requires.every(req => {
        const stateVal = stateManager.get(req.state);
        switch (req.operator) {
          case '==': return stateVal === req.value;
          case '!=': return stateVal !== req.value;
          case '>': return stateVal > req.value;
          case '<': return stateVal < req.value;
          case '>=': return stateVal >= req.value;
          case '<=': return stateVal <= req.value;
          default: return false;
        }
      });
    });
  }

  handleChoice(choice) {
    if (choice.effects) {
      choice.effects.forEach(eff => {
        switch (eff.operation) {
          case 'set': stateManager.set(eff.state, eff.value); break;
          case 'add': stateManager.add(eff.state, eff.value); break;
          case 'subtract': stateManager.subtract(eff.state, eff.value); break;
        }
      });
    }
    
    this.goToNode(choice.target);
  }
}

export const sceneParser = new SceneParser();
