import './ui/styles/global.css';
import { sceneParser } from './core/SceneParser.js';
import { TableauRenderer } from './ui/components/TableauRenderer.js';
import { DialogueBox } from './ui/components/DialogueBox.js';
import { ChoiceMenu } from './ui/components/ChoiceMenu.js';

function bootstrap() {
  // Initialize UI Components
  const tableau = new TableauRenderer('tableau');
  const dialogueBox = new DialogueBox('dialogue-area');
  const choiceMenu = new ChoiceMenu('choices-container');

  // Load initial scene
  // In a real app, this might come from a router or save file
  sceneParser.loadScene('/data/scenes/ch001-terminal.json');
}

// Run the engine
document.addEventListener('DOMContentLoaded', bootstrap);
