import * as THREE from 'three';
import { PALETTE } from './materials.js';
import { buildEnvironment } from './environment.js';
import { buildCameraRig } from './camera-rig.js';
import { createInteractor } from './interact.js';
import { buildOrigin } from './stations/origin.js';
import { buildIdentity } from './stations/identity.js';
import { buildSkills } from './stations/skills.js';
import { buildWorks } from './stations/works.js';
import { buildPath } from './stations/path.js';
import { buildContact } from './stations/contact.js';
import { skills, projects, profile } from '../data/content.js';
import { state } from '../core/state.js';

export const STATION_ANCHORS = [
  { x: 0, z: -8, radius: 7.5 },
  { x: -14, z: -25, radius: 6 },
  { x: 16, z: -53, radius: 7.5 },
  { x: -10, z: -74, radius: 7.5 },
  { x: 13, z: -96, radius: 7 },
  { x: 0, z: -119, radius: 7.5 },
];

export function detectQuality() {
  const mobile = state.isMobile;
  const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;
  return {
    tier: 0,
    stars: mobile ? 170 : 340,
    dust: mobile ? 240 : 650,
    pillars: mobile ? 60 : 120,
    lowPower,
  };
}

export function createWorld(container) {
  const quality = detectQuality();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !quality.lowPower,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
    });
  } catch {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.ink);
  scene.fog = new THREE.FogExp2(PALETTE.ink, 0.009);

  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 600
  );
  camera.position.set(0, 3.4, 12);

  // Moonlit arctic lighting — cool hemisphere, blue key, faint ice fill.
  const hemi = new THREE.HemisphereLight(0x2a3c58, 0x05080f, 1.05);
  const keyLight = new THREE.DirectionalLight(0xbfd8ff, 0.75);
  keyLight.position.set(-40, 30, -80);
  const fill = new THREE.DirectionalLight(0x6ee7f0, 0.2);
  fill.position.set(20, 18, 10);
  scene.add(hemi, keyLight, fill);

  // Camera rig first — its path defines where scenery must not spawn.
  const rig = buildCameraRig(camera);

  const env = buildEnvironment({
    anchors: STATION_ANCHORS,
    pathPoints: rig.pathPoints,
    quality,
  });
  scene.add(env.group);

  const stations = [
    buildOrigin({ reducedMotion: state.reducedMotion }),
    buildIdentity({ reducedMotion: state.reducedMotion }),
    buildSkills({ skills, reducedMotion: state.reducedMotion }),
    buildWorks({ projects }),
    buildPath({ reducedMotion: state.reducedMotion }),
    buildContact({ profile, reducedMotion: state.reducedMotion }),
  ];
  stations.forEach((s) => scene.add(s.group));

  const interactor = createInteractor(camera, renderer.domElement);
  stations.forEach((s) => s.hoverables.forEach((h) => interactor.register(h)));

  const clock = new THREE.Clock();
  let elapsed = 0;

  function update() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt * (state.reducedMotion ? 0.35 : 1);
    rig.update(dt, elapsed);
    stations.forEach((s) => s.update(elapsed, dt, state.reducedMotion));
    env.update(elapsed, dt, state.reducedMotion);
    interactor.frame();
    renderer.render(scene, camera);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 70 : 55;
    camera.updateProjectionMatrix();
    const cap = quality.tier === 0 ? 2 : quality.tier === 1 ? 1.5 : 1.25;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, cap));
    renderer.setSize(w, h);
  }

  function degrade() {
    if (quality.tier >= 2) return;
    quality.tier += 1;
    env.setQualityTier(quality.tier);
    resize();
  }

  resize();
  return {
    update,
    resize,
    degrade,
    domElement: renderer.domElement,
    skillsStation: stations[2],
    onContextLost: (handler) => {
      renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        handler();
      });
    },
  };
}
