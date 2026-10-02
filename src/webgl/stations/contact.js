import * as THREE from 'three';
import { mat, edgesOf, makeLabel, PALETTE } from '../materials.js';
import { makeIsland } from './station-kit.js';
import { emit } from '../../core/state.js';

export function buildContact({ profile, reducedMotion }) {
  const group = new THREE.Group();
  group.position.set(0, 0, -119);

  const island = makeIsland(11, 11);

  // ---- beacon mast ----------------------------------------------------------
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 5.6, 12), mat.slab);
  mast.position.set(0, 2.8, -2.4);
  const tipMat = new THREE.MeshBasicMaterial({ color: PALETTE.gold });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 14), tipMat);
  tip.position.set(0, 5.68, -2.4);

  // radar rings expanding from the beacon base
  const ringMatA = new THREE.MeshBasicMaterial({ color: PALETTE.ice, transparent: true, opacity: 0.3, depthWrite: false });
  const ringGeo = new THREE.TorusGeometry(1, 0.02, 8, 72);
  const rings = [0, 1, 2].map((i) => {
    const r = new THREE.Mesh(ringGeo, i === 0 ? ringMatA : ringMatA.clone());
    r.rotation.x = -Math.PI / 2;
    r.position.set(0, 0.06, -2.4);
    group.add(r);
    return r;
  });

  // ---- the dish ---------------------------------------------------------------
  const dishPoints = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    dishPoints.push(new THREE.Vector2(0.16 + t * 1.3, t * t * 0.62));
  }
  const dishGroup = new THREE.Group();
  const dish = new THREE.Mesh(
    new THREE.LatheGeometry(dishPoints, 36),
    new THREE.MeshStandardMaterial({
      color: 0x16223a, roughness: 0.35, metalness: 0.5,
      side: THREE.DoubleSide,
    })
  );
  const dishEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(dish.geometry, 24),
    mat.edgeIce
  );
  const feed = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), mat.goldGlow);
  feed.position.y = 0.34;
  dishGroup.add(dish, dishEdges, feed);
  dishGroup.position.set(-2.1, 1.15, 0.9);
  dishGroup.rotation.x = -0.62;
  dishGroup.rotation.z = 0.28;

  const pedestalGeo = new THREE.CylinderGeometry(0.22, 0.3, 1.15, 16);
  const pedestal = new THREE.Mesh(pedestalGeo, mat.slab);
  pedestal.position.set(-2.1, 0.57, 0.9);
  const pedestalEdges = edgesOf(pedestalGeo);
  pedestalEdges.position.copy(pedestal.position);

  const label = makeLabel('04 · TRANSMIT', { size: 30, accent: '#6ee7f0', worldHeight: 0.36 });
  label.position.set(0, 1.05, 6.6);
  const hintLabel = makeLabel('click the lantern to copy my email', {
    size: 20, color: '#8fa3b8', worldHeight: 0.21,
  });
  hintLabel.position.set(0, 0.55, 6.9);

  group.add(island, mast, tip, dishGroup, pedestal, pedestalEdges, label, hintLabel);

  let hoveredTip = false;

  function update(t, dt) {
    void dt;
    if (reducedMotion) {
      rings.forEach((r, i) => {
        r.scale.setScalar(1.4 + i * 1.1);
        r.material.opacity = 0.16;
      });
      return;
    }
    rings.forEach((r, i) => {
      const p = ((t * 0.32 + i / rings.length) % 1 + 1) % 1;
      r.scale.setScalar(0.7 + p * 4.6);
      r.material.opacity = (1 - p) * 0.42;
    });
    const pulse = Math.sin(t * 2.4) > 0.55;
    tipMat.color.setHex(pulse ? 0xffe3b0 : PALETTE.gold);
    if (!hoveredTip) {
      dishGroup.rotation.y = Math.sin(t * 0.24) * 0.16;
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      emit('toast', 'email copied to clipboard');
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  }

  const hoverables = [
    {
      objects: [tip, mast],
      label: `copy — ${profile.email}`,
      onHover(a) {
        hoveredTip = a;
        document.body.dataset.cursor = a ? 'pointer' : 'default';
      },
      onClick() { copyEmail(); },
    },
    {
      objects: [dish],
      label: 'the transmission dish',
      onHover(a) {
        document.body.dataset.cursor = a ? 'pointer' : 'default';
      },
      onClick() { emit('toast', 'signal strong — say hello below'); },
    },
  ];

  return { group, update, hoverables };
}
