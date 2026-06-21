import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * Loads a GLTF/GLB model from the specified URL.
   * @param {string} url - The path to the model file.
   * @returns {Promise} Resolves with the loaded gltf object, or rejects on error.
   */
  loadGLTF(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          resolve(gltf);
        },
        (progress) => {
          // Can be used for loading bar in the future
          // console.log(`Loading model... ${(progress.loaded / progress.total * 100)}%`);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }
}

// Export a singleton instance for global use
export const modelLoader = new ModelLoader();
