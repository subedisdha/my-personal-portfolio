import * as THREE from 'three';
import { mat, edgesOf } from '../materials.js';

// Shared building blocks for stations.

export function makeIsland(width, depth) {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(width, 0.34, depth);
  const slab = new THREE.Mesh(geo, mat.slab);
  slab.position.y = -0.17;
  const edges = edgesOf(geo);
  edges.position.y = -0.17;
  group.add(slab, edges);
  return group;
}

// Vertical bobbing motion helper.
export function bob(obj, { baseY, amp = 0.12, speed = 1, phase = 0 }) {
  obj.userData.baseY = baseY;
  return (t) => {
    obj.position.y = baseY + Math.sin(t * speed + phase) * amp;
  };
}
