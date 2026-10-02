import * as THREE from 'three';
import { state, emit, on } from '../core/state.js';

/**
 * Registry of interactive 3D objects. Each entry:
 *   { objects: Mesh[], label: string, onHover(bool, hit), onClick(point) }
 */
export function createInteractor(camera, domElement) {
  const raycaster = new THREE.Raycaster();
  const entries = [];
  let hoveredEntry = null;
  const pointerNdc = new THREE.Vector2();

  function ndcFromClient(x, y) {
    return {
      x: (x / window.innerWidth) * 2 - 1,
      y: -(y / window.innerHeight) * 2 + 1,
    };
  }

  function pick(ndcX, ndcY) {
    pointerNdc.set(ndcX, ndcY);
    raycaster.setFromCamera(pointerNdc, camera);
    const meshes = [];
    const owner = new Map();
    for (const e of entries) {
      for (const o of e.objects) {
        if (o.parent) {
          meshes.push(o);
          owner.set(o, e);
        }
      }
    }
    const hits = raycaster.intersectObjects(meshes, false);
    return hits.length > 0 ? { entry: owner.get(hits[0].object), hit: hits[0] } : null;
  }

  function setHovered(next) {
    if (next === hoveredEntry) return;
    if (hoveredEntry?.onHover) hoveredEntry.onHover(false);
    hoveredEntry = next;
    if (hoveredEntry?.onHover) hoveredEntry.onHover(true);
    document.body.dataset.cursor = hoveredEntry ? 'pointer' : 'default';
    emit('hover-label', hoveredEntry ? hoveredEntry.label : null);
  }

  // Latest normalized pointer position (kept in sync via window-level events).
  const latest = { x: 0, y: 0 };

  function frame() {
    if (!state.entered || state.modalOpen) {
      setHovered(null);
      return;
    }
    const found = pick(latest.x, latest.y);
    setHovered(found ? found.entry : null);
    if (found?.entry.onMove) found.entry.onMove(found.hit);
  }

  on('pointer-move', ({ x, y }) => {
    const n = ndcFromClient(x, y);
    latest.x = n.x;
    latest.y = n.y;
  });

  on('tap', ({ x, y }) => {
    if (!state.entered || state.modalOpen) return;
    const n = ndcFromClient(x, y);
    const found = pick(n.x, n.y);
    if (found?.entry.onClick) found.entry.onClick(found.hit.point);
  });

  domElement.addEventListener('pointerleave', () => setHovered(null));

  function register(entry) {
    entries.push(entry);
    return () => {
      const i = entries.indexOf(entry);
      if (i !== -1) entries.splice(i, 1);
      if (hoveredEntry === entry) setHovered(null);
    };
  }

  return { register, frame };
}
