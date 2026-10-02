import * as THREE from 'three';
import { mat, edgesOf, makeLabel, PALETTE } from '../materials.js';
import { makeIsland } from './station-kit.js';

export function buildOrigin({ reducedMotion }) {
  const group = new THREE.Group();
  group.position.set(0, 0, -8);

  // ---- lighthouse tower -----------------------------------------------------
  const towerGeo = new THREE.CylinderGeometry(0.62, 1.05, 7, 20);
  const tower = new THREE.Mesh(towerGeo, mat.bone);
  tower.position.y = 3.5;

  // dark banding stripes
  const stripeMat = new THREE.MeshStandardMaterial({
    color: PALETTE.slab, roughness: 0.85, metalness: 0.05,
  });
  [2.2, 4.4].forEach((y) => {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.86 - (y - 2) * 0.06, 0.92 - (y - 2) * 0.06, 0.5, 20), stripeMat);
    band.position.y = y;
    group.add(band);
  });
  const towerEdges = edgesOf(towerGeo);
  towerEdges.position.y = 3.5;
  towerEdges.visible = false; // smooth tower reads better than wireframe

  // gallery deck + railing posts
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.14, 24), mat.slab);
  deck.position.y = 7.07;
  const deckEdge = edgesOf(deck.geometry);
  deckEdge.position.y = 7.07;

  // ---- lantern room -----------------------------------------------------------
  const lampMat = new THREE.MeshStandardMaterial({
    color: PALETTE.iceHot,
    emissive: PALETTE.ice,
    emissiveIntensity: 1.35,
    roughness: 0.25,
    transparent: true,
    opacity: 0.9,
  });
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.95, 16), lampMat);
  lamp.position.y = 7.65;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.6, 16), stripeMat);
  roof.position.y = 8.42;
  const roofTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 8),
    mat.goldGlow
  );
  roofTip.position.y = 8.82;

  // ---- rotating twin beams ------------------------------------------------------
  const beamGroup = new THREE.Group();
  beamGroup.position.y = 7.65;
  const beamMat = new THREE.MeshBasicMaterial({
    color: PALETTE.iceHot,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide,
  });
  const beamGeo = new THREE.CylinderGeometry(2.6, 0.12, 30, 18, 1, true);
  [0, Math.PI].forEach((angle) => {
    const pivot = new THREE.Group();
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.x = 15;
    pivot.rotation.y = angle;
    pivot.add(beam);
    beamGroup.add(pivot);
  });

  // ---- orbiting idea-shards -------------------------------------------------------
  const orbiters = new THREE.Group();
  const orbSpecs = [
    { r: 2.7, y: 2.4, s: 0.32, sp: 0.5, hot: 'gold' },
    { r: 3.3, y: 4.6, s: 0.22, sp: 0.34, hot: 'ice' },
    { r: 2.35, y: 5.6, s: 0.16, sp: 0.62, hot: null },
    { r: 3.8, y: 3.1, s: 0.26, sp: 0.24, hot: null },
    { r: 2.95, y: 6.3, s: 0.18, sp: 0.44, hot: 'ice' },
  ];
  orbSpecs.forEach((spec, i) => {
    const pivot = new THREE.Group();
    const shard = new THREE.Mesh(
      spec.hot ? new THREE.OctahedronGeometry(spec.s, 0) : new THREE.BoxGeometry(spec.s, spec.s, spec.s),
      spec.hot === 'gold' ? mat.goldGlow : spec.hot === 'ice' ? mat.accentGlow : mat.bone
    );
    shard.position.set(spec.r, spec.y - 3.5, 0);
    if (!reducedMotion) {
      pivot.rotation.z = (i / orbSpecs.length) * Math.PI;
    }
    pivot.add(shard);
    pivot.rotation.y = (i * 2 * Math.PI) / orbSpecs.length;
    pivot.userData.spec = spec;
    orbiters.add(pivot);
  });

  // Two tilted light-rings around the tower
  const ringGeo = new THREE.TorusGeometry(3.1, 0.03, 8, 96);
  const ringA = new THREE.Mesh(ringGeo, mat.edgeIce);
  ringA.position.y = 3.9;
  ringA.rotation.x = Math.PI / 2.25;
  const ringB = new THREE.Mesh(ringGeo, mat.edgeIce);
  ringB.position.y = 3.9;
  ringB.rotation.set(Math.PI / 1.85, 0.4, 0);

  const island = makeIsland(11, 11);

  const label = makeLabel('00 · ORIGIN', {
    size: 30, accent: '#6ee7f0', worldHeight: 0.36,
  });
  label.position.set(0, 1.05, 6.6);

  group.add(tower, deck, deckEdge, lamp, roof, roofTip, beamGroup, towerEdges,
    orbiters, ringA, ringB, island, label);

  let beamBoost = 0;

  function update(t, dt) {
    const rm = reducedMotion;
    orbiters.children.forEach((pivot, i) => {
      if (rm) return;
      pivot.rotation.y += dt * pivot.userData.spec.sp * (i % 2 ? -1 : 1);
    });
    if (!rm) {
      ringA.rotation.z += dt * 0.12;
      ringB.rotation.z -= dt * 0.09;
      beamBoost = Math.max(0, beamBoost - dt * 1.6);
      beamGroup.rotation.y += dt * (0.55 + beamBoost * 2.2);
      beamMat.opacity = 0.085 + 0.045 * Math.sin(t * 3.1) + beamBoost * 0.1;
    }
    lampMat.emissiveIntensity = rm
      ? 1.2
      : 1.15 + 0.35 * Math.sin(t * 2.6) + beamBoost * 0.9;
  }

  return {
    group,
    update,
    hoverables: [
      {
        objects: [tower, lamp],
        label: 'the lighthouse — welcome to my workshop',
        onHover() {},
        onClick() { beamBoost = 1; },
      },
    ],
  };
}
