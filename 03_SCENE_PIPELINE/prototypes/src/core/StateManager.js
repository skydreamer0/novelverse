import { bus } from './EventBus.js';

export class StateManager {
  constructor() {
    this.state = {};
  }

  init(defaultState = {}) {
    this.state = { ...defaultState };
    // Optionally load from localStorage here for a real save system
    this.loadFromStorage();
    bus.emit('state:initialized', this.state);
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this.saveToStorage();
    bus.emit('state:changed', { key, value, state: this.state });
  }

  add(key, value) {
    if (this.state[key] === undefined) this.state[key] = 0;
    this.state[key] += value;
    this.saveToStorage();
    bus.emit('state:changed', { key, value: this.state[key], state: this.state });
  }

  subtract(key, value) {
    if (this.state[key] === undefined) this.state[key] = 0;
    this.state[key] -= value;
    this.saveToStorage();
    bus.emit('state:changed', { key, value: this.state[key], state: this.state });
  }

  saveToStorage() {
    try {
      localStorage.setItem('novelverse_save', JSON.stringify(this.state));
    } catch (e) {
      console.warn("Local storage not available", e);
    }
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('novelverse_save');
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Could not load from storage", e);
    }
  }
}

export const stateManager = new StateManager();
