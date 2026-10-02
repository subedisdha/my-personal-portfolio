import * as THREE from 'three';
import { makeLabel, PALETTE } from '../materials.js';
import { makeIsland } from './station-kit.js';
import { emit } from '../../core/state.js';
import { seededRandom } from '../../utils/math.js';

const CATEGORY_COLORS = {
  FRONTEND: '#6ee7f0',
  BACKEND: '#e8f0f7',
  DATABASE: '#9d8cff',
  TOOLS: '#8fa3b8',
  CREATIVE: '#ffcf87',
};

export function buildSkills({ skills, reducedMotion }) {
  const group = new THREE.Group();
  group.position.set(16, 3.0, -53);

  const island = makeIsland(12, 9);
  island.position.y = -3.0;

  // Pentagon arrangement of category anchors (plane faces the camera path)
  const anchorPos = [
    new THREE.Vector3(0, 2.35, 0),     // FRONTEND
    new THREE.Vector3(2.95, 0.95, -0.4), // BACKEND
    new THREE.Vector3(2.1, -1.6, 0.3),   // DATABASE
    new THREE.Vector3(-2.1, -1.6, 0.3),  // TOOLS
    new THREE.Vector3(-2.95, 0.95, -0.4),// CREATIVE
  ];

  const nodeMatIdle = new THREE.MeshStandardMaterial({ color: PALETTE.bone, roughness: 0.35, metalness: 0.2 });
  const nodeMatHot = new THREE.MeshBasicMaterial({ color: PALETTE.ice });
  const nodeMatDim = new THREE.MeshStandardMaterial({ color: 0x2c3a52, roughness: 0.7 });

  const nodesByCategory = [];
  const allNodes = [];

  // Faint pentagon web between anchors
  const webPts = [];
  anchorPos.forEach((p, i) => {
    const q = anchorPos[(i + 1) % anchorPos.length];
    webPts.push(p, q);
  });
  const webGeo = new THREE.BufferGeometry().setFromPoints(webPts);
  const web = new THREE.LineSegments(
    webGeo,
    new THREE.LineBasicMaterial({ color: PALETTE.ice, transparent: true, opacity: 0.16 })
  );
  group.add(web);

  const hoverables = [];
  const wobble = [];

  skills.forEach((cat, ci) => {
    const anchor = anchorPos[ci];
    const cluster = new THREE.Group();
    cluster.position.copy(anchor);
    group.add(cluster);

    const anchorMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.17, 0),
      new THREE.MeshStandardMaterial({
        color: PALETTE.ice, roughness: 0.2, metalness: 0.55,
        emissive: PALETTE.ice, emissiveIntensity: 0.15,
      })
    );
    cluster.add(anchorMesh);

    const catLabel = makeLabel(cat.group, {
      size: 24,
      color: CATEGORY_COLORS[cat.group] === '#6ee7f0' ? '#6ee7f0' : '#c3d2e2',
      worldHeight: 0.26,
    });
    catLabel.position.set(0, -0.52, 0);
    cluster.add(catLabel);

    const nodes = [];
    cat.items.forEach((item, ii) => {
      const seed = ci * 17 + ii * 7 + 3;
      const local = new THREE.Vector3(
        (seededRandom(seed) - 0.5) * 1.7,
        (seededRandom(seed + 1) - 0.5) * 1.25,
        (seededRandom(seed + 2) - 0.5) * 1.1
      );
      if (local.length() < 0.55) local.setLength(0.75);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), nodeMatIdle);
      mesh.position.copy(local);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), local]),
        new THREE.LineBasicMaterial({ color: PALETTE.ice, transparent: true, opacity: 0.3 })
      );
      cluster.add(mesh, line);
      nodes.push(mesh);
      allNodes.push(mesh);
      wobble.push({
        obj: mesh, base: local.clone(), phase: seededRandom(seed + 4) * Math.PI * 2,
        speed: 0.6 + seededRandom(seed + 5) * 0.7, amp: 0.06,
      });
      void item;
    });
    nodesByCategory.push(nodes);

    hoverables.push({
      objects: nodes,
      label: `${cat.group.toLowerCase()} — ${cat.items.join(' · ')}`,
      onHover(active) {
        setCategory(ci, active);
        if (active) emit('skill-hover', ci);
      },
      onClick() {
        emit('skill-select', ci);
      },
    });
  });

  function setCategory(ci, active) {
    nodesByCategory.forEach((nodes, i) => {
      const isTarget = i === ci;
      nodes.forEach((n) => {
        n.material = active && isTarget ? nodeMatHot : active ? nodeMatDim : nodeMatIdle;
      });
    });
  }

  function highlightFromUI(ci) {
    setCategory(ci, true);
    setTimeout(() => setCategory(ci, false), 1600);
  }

  function update(t, dt) {
    if (reducedMotion) return;
    wobble.forEach((w) => {
      w.obj.position.set(
        w.base.x + Math.sin(t * w.speed + w.phase) * w.amp,
        w.base.y + Math.cos(t * w.speed * 0.85 + w.phase) * w.amp,
        w.base.z
      );
    });
    group.rotation.y = Math.sin(t * 0.11) * 0.05;
    void dt;
  }

  return { group, update, hoverables, highlightFromUI };
}
