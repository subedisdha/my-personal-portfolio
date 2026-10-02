import * as THREE from 'three';
import { state, emit, SECTIONS } from '../core/state.js';
import { input } from '../core/input.js';
import { clamp, lerp, damp, smoothstep } from '../utils/math.js';

// Camera viewpoints + gaze targets, one pair per station.
const CAM_POS = [
  [0, 3.4, 12],      // origin
  [-14, 3.6, -13],   // identity
  [16, 4.0, -37],    // skills
  [-10, 3.8, -57],   // works
  [13, 3.4, -81],    // path
  [0, 3.6, -103],    // contact
];
const LOOK_AT = [
  [0, 3.4, -8],
  [-14, 2.8, -25],
  [16, 3.0, -53],
  [-10, 3.0, -74],
  [13, 2.6, -96],
  [0, 4.2, -120],
];

export function buildCameraRig(camera) {
  const camVectors = CAM_POS.map((p) => new THREE.Vector3(...p));
  const looks = LOOK_AT.map((p) => new THREE.Vector3(...p));

  const curve = new THREE.CatmullRomCurve3(camVectors, false, 'centripetal', 0.5);

  // Arc-length parameter u for each station (curve.getPointAt is arc-length based).
  const SAMPLES = 600;
  const sampled = [];
  for (let k = 0; k <= SAMPLES; k++) sampled.push(curve.getPointAt(k / SAMPLES));
  const uStation = camVectors.map((cp) => {
    let best = 0;
    let bestDist = Infinity;
    sampled.forEach((p, k) => {
      const d = p.distanceToSquared(cp);
      if (d < bestDist) { bestDist = d; best = k; }
    });
    return best / SAMPLES;
  });

  const pathPoints = sampled.filter((_, k) => k % 6 === 0).map((p) => ({ x: p.x, z: p.z }));

  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const parallaxX = new THREE.Vector3();
  const parallaxY = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const smoothedPointer = { x: 0, y: 0 };

  function computePose(s) {
    const last = SECTIONS.length - 1;
    const i = clamp(Math.floor(s), 0, last - 1);
    const f = smoothstep(clamp(s - i, 0, 1));
    const u = lerp(uStation[i], uStation[i + 1], f);
    curve.getPointAt(u, pos);
    look.lerpVectors(looks[i], looks[i + 1], f);
  }

  function update(dt, t) {
    // Idle magnet: settle gently onto the nearest station.
    if (!input.dragging && performance.now() - input.lastInteraction > 900 && !state.reducedMotion) {
      const nearest = Math.round(state.target);
      if (Math.abs(state.target - nearest) < 0.32 && Math.abs(state.target - nearest) > 0.0015) {
        state.target += (nearest - state.target) * Math.min(1, dt * 2.6);
      }
    }

    // Damp continuous position toward target.
    const dist = Math.abs(state.target - state.float);
    const lambda = state.reducedMotion ? 30 : 4.2 + Math.min(dist, 3) * 1.4;
    const next = damp(state.float, state.target, lambda, dt);
    if (Math.abs(next - state.target) < 0.0012 && Math.abs(state.float - state.target) >= 0.0012) {
      emit('arrived', Math.round(state.target));
    }
    state.float = next;

    const idx = clamp(Math.round(state.float), 0, SECTIONS.length - 1);
    if (idx !== state.index) {
      state.index = idx;
      emit('section', SECTIONS[idx]);
      emit('index', idx);
    }

    computePose(state.float);

    // Pointer parallax (desktop) / slow ambient sway (touch).
    if (state.reducedMotion || state.isTouch) {
      const sway = state.reducedMotion ? 0 : Math.sin(t * 0.14) * 0.1;
      camera.position.copy(pos);
      camera.position.y += sway;
    } else {
      smoothedPointer.x = damp(smoothedPointer.x, input.px, 4.5, dt);
      smoothedPointer.y = damp(smoothedPointer.y, input.py, 4.5, dt);
      forward.subVectors(look, pos).normalize();
      parallaxX.crossVectors(forward, camera.up).normalize();
      parallaxY.crossVectors(parallaxX, forward).normalize();
      camera.position.copy(pos)
        .addScaledVector(parallaxX, smoothedPointer.x * 0.55)
        .addScaledVector(parallaxY, -smoothedPointer.y * 0.38);
    }

    camera.lookAt(
      look.x + (smoothedPointer.x * -0.7),
      look.y + (smoothedPointer.y * 0.45),
      look.z
    );

    return { position: camera.position };
  }

  return { update, pathPoints, curve };
}
