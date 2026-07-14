import * as THREE from 'three';

export function rankInteractionTargets(candidates) {
  const valid = candidates.filter((candidate) => (
    candidate.enabled !== false
    && Number.isFinite(candidate.distance)
    && candidate.distance <= (candidate.maxDistance ?? 3.2)
  ));
  if (!valid.length) return null;
  valid.sort((a, b) => (
    (b.priority ?? 0) - (a.priority ?? 0)
    || a.distance - b.distance
    || String(a.id).localeCompare(String(b.id))
  ));
  return valid[0];
}

export class InteractionSystem {
  constructor(camera, { onPrompt = () => {}, onAction = () => {} } = {}) {
    this.camera = camera;
    this.onPrompt = onPrompt;
    this.onAction = onAction;
    this.targets = [];
    this.current = null;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 5;
    this.handleKey = (event) => {
      if (event.code === 'KeyE' && !event.repeat && this.current) {
        this.onAction(this.current.action, this.current);
      }
    };
    document.addEventListener('keydown', this.handleKey);
  }

  setTargets(targets) {
    this.targets = targets;
  }

  update() {
    const enabled = this.targets.filter((target) => target.enabled !== false && target.object?.visible !== false);
    this.raycaster.far = Math.max(
      5,
      ...enabled.map((target) => Number.isFinite(target.maxDistance) ? target.maxDistance : 0),
    );
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    const roots = enabled.map((target) => target.object);
    const hits = this.raycaster.intersectObjects(roots, true);
    const candidates = [];

    for (const hit of hits) {
      const target = enabled.find((entry) => this.#belongsTo(hit.object, entry.object));
      if (!target || candidates.some((entry) => entry.id === target.id)) continue;
      candidates.push({ ...target, distance: hit.distance });
    }

    this.current = rankInteractionTargets(candidates);
    this.onPrompt(this.current);
  }

  dispose() {
    document.removeEventListener('keydown', this.handleKey);
  }

  #belongsTo(object, root) {
    let current = object;
    while (current) {
      if (current === root) return true;
      current = current.parent;
    }
    return false;
  }
}
