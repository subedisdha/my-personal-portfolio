import * as THREE from 'three';
import { mat, edgesOf, makeLabel, PALETTE } from '../materials.js';
import { makeIsland } from './station-kit.js';

export function buildIdentity({ reducedMotion }) {
  const group = new THREE.Group();
  group.position.set(-14, 0, -25);

  const island = makeIsland(10, 10);
  const pedestalGeo = new THREE.CylinderGeometry(1.15, 1.35, 0.55, 28);
  const pedestal = new THREE.Mesh(pedestalGeo, mat.slab);
  pedestal.position.y = 0.27;
  const pedestalEdges = edgesOf(pedestalGeo);
  pedestalEdges.position.y = 0.27;

  // Gyroscope rings around a glowing core
  const gyro = new THREE.Group();
  gyro.position.y = 2.6;

  const ringSpecs = [
    { r: 1.75, speed: 0.5, axis: 'x', tilt: Math.PI / 2.4 },
    { r: 1.38, speed: -0.7, axis: 'y', tilt: Math.PI / 3 },
    { r: 1.02, speed: 1.05, axis: 'z', tilt: Math.PI / 1.7 },
  ];
  const rings = ringSpecs.map((spec) => {
    const pivot = new THREE.Group();
    pivot.rotation.set(
      spec.axis === 'x' ? spec.tilt : 0,
      spec.axis === 'y' ? spec.tilt : 0,
      spec.axis === 'z' ? spec.tilt : 0
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.r, 0.045, 10, 80),
      new THREE.MeshStandardMaterial({
        color: PALETTE.ice, roughness: 0.2, metalness: 0.6,
        emissive: PALETTE.ice, emissiveIntensity: 0.08,
      })
    );
    pivot.add(ring);
    pivot.userData.speed = reducedMotion ? 0 : spec.speed;
    gyro.add(pivot);
    return pivot;
  });

  const coreMat = new THREE.MeshStandardMaterial({
    color: PALETTE.violet,
    emissive: PALETTE.violet,
    emissiveIntensity: 0.55,
    roughness: 0.3,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), coreMat);

  const label = makeLabel('01 · IDENTITY', {
    size: 30, accent: '#6ee7f0', worldHeight: 0.36,
  });
  label.position.set(0, 1.05, 6.4);

  group.add(island, pedestal, pedestalEdges, gyro, core, label);

  let hoverBoost = 0;
  let pulse = 0;

  function update(t, dt) {
    hoverBoost = Math.max(0, hoverBoost - dt * 2.4);
    pulse = Math.max(0, pulse - dt * 2.8);
    rings.forEach((pivot) => {
      pivot.rotation.y += dt * pivot.userData.speed * (1 + hoverBoost * 1.6);
      pivot.rotation.x += dt * pivot.userData.speed * 0.35 * (1 + hoverBoost);
    });
    const s = 1 + Math.sin(t * 2.2) * 0.05 * (reducedMotion ? 0 : 1) + pulse * 0.55 + hoverBoost * 0.18;
    core.scale.setScalar(s);
    coreMat.emissiveIntensity = 0.5 + hoverBoost * 1.1 + pulse * 0.9;
  }

  const hoverable = {
    objects: [core, ...rings.flatMap((p) => p.children)],
    label: 'identity — who is behind this',
    onHover(active) {
      hoverBoost = active ? 1 : hoverBoost;
    },
    onClick() {
      pulse = 1;
    },
  };

  return { group, update, hoverables: [hoverable] };
}
