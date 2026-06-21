import { bus } from './EventBus.js';

export class AssetLoader {
  constructor() {
    this.cache = new Map();
  }

  async preloadImage(url) {
    if (this.cache.has(url)) return this.cache.get(url);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  async preloadSceneAssets(sceneData) {
    if (!sceneData || !sceneData.nodes) return;
    
    const imagePromises = [];
    sceneData.nodes.forEach(node => {
      if (node.visuals && node.visuals.background) {
        imagePromises.push(this.preloadImage(node.visuals.background));
      }
      // Add sprite preloading here if implemented
    });
    
    try {
      await Promise.all(imagePromises);
      bus.emit('assets:loaded');
    } catch (e) {
      console.warn("Asset preloading encountered issues:", e);
    }
  }
}

export const assetLoader = new AssetLoader();
