import * as THREE from 'three';
import { PALETTE } from './materials.js';
import { seededRandom } from '../utils/math.js';

// Night-sky gradient stops for the dome shader.
const NIGHT = {
  top: new THREE.Color(0x04070f),
  horizon: new THREE.Color(0x0d1830),
  glow: new THREE.Color(0x123043), // cold teal band above the ridge line
};

function makeSky() {
  const geo = new THREE.SphereGeometry(250, 28, 18);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: NIGHT.top },
      uHorizon: { value: NIGHT.horizon },
      uGlow: { value: NIGHT.glow },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGlow;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, -0.05, 1.0);
        vec3 col = mix(uHorizon, uTop, smoothstep(0.01, 0.5, h));
        // cold teal breathing band just above the horizon
        col += uGlow * exp(-pow((h - 0.02) * 7.0, 2.0)) * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.renderOrder = -10;
  return sky;
}

/**
 * Aurora borealis — three drifting curtain layers composited in one shader
 * on a distant plane. Additive blending keeps it luminous but cheap.
 */
function makeAurora() {
  const geo = new THREE.PlaneGeometry(340, 95, 1, 1);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uIntensity;
      varying vec2 vUv;

      float curtain(vec2 uv, float seed) {
        float x = uv.x * 3.0 + seed * 7.31;
        float wave =
          sin(x * 1.6 + uTime * (0.22 + seed * 0.10)) * 0.50 +
          sin(x * 3.4 - uTime * (0.14 + seed * 0.07)) * 0.26 +
          sin(x * 0.7 + uTime * 0.09) * 0.30;
        float center = uv.y - 0.42 - wave * 0.20 - seed * 0.11;
        float band = exp(-pow(center * (5.4 - seed * 0.9), 2.0));
        // vertical ray streaks
        float streak = 0.72 + 0.28 * sin(uv.x * 110.0 + uTime * 0.45 + seed * 43.0);
        return band * streak;
      }

      void main() {
        float a1 = curtain(vUv, 0.0);
        float a2 = curtain(vUv, 1.0);
        float a3 = curtain(vUv, 2.35);
        vec3 greenCyan = vec3(0.24, 0.92, 0.72);
        vec3 violet = vec3(0.58, 0.52, 1.00);
        vec3 col =
          greenCyan * a1 +
          mix(greenCyan, violet, 0.62) * a2 +
          violet * a3 * 0.85;
        float alpha = clamp((a1 + a2 + a3) * 0.42, 0.0, 1.0) * uIntensity;
        alpha *= smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
        alpha *= smoothstep(0.0, 0.08, vUv.y);
        gl_FragColor = vec4(col * alpha, alpha);
      }`,
  });
  const aurora = new THREE.Mesh(geo, mat);
  aurora.position.set(-10, 46, -212);
  aurora.renderOrder = -9;
  return aurora;
}

function makeStars(count) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = seededRandom(i * 3 + 1) * Math.PI * 2;
    const phi = Math.acos(1 - seededRandom(i * 3 + 2) * 0.78); // upper dome bias
    const r = 235;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) + 4;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xcfe4ff,
    size: 0.85,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    fog: false,
  });
  return new THREE.Points(geo, mat);
}

function makeMoon() {
  const g = new THREE.Group();
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(15, 48),
    new THREE.MeshBasicMaterial({
      color: 0xaecdf0, transparent: true, opacity: 0.12,
      depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
    })
  );
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(6.4, 48),
    new THREE.MeshBasicMaterial({
      color: 0xe9f2fc, transparent: true, opacity: 0.95,
      depthWrite: false, fog: false,
    })
  );
  halo.position.z = -1;
  g.add(halo, disc);
  g.position.set(-58, 47, -190);
  g.lookAt(0, 5, -40);
  g.renderOrder = -8;
  return g;
}

function makeGridTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 1024, 1024);
  const minor = 'rgba(110,231,240,0.09)';
  const major = 'rgba(110,231,240,0.18)';
  for (let i = 0; i <= 1024; i += 32) {
    ctx.strokeStyle = i % 256 === 0 ? major : minor;
    ctx.lineWidth = i % 256 === 0 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(i + 0.5, 0); ctx.lineTo(i + 0.5, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i + 0.5); ctx.lineTo(1024, i + 0.5); ctx.stroke();
  }
  // radial fade so the grid dissolves into the night
  ctx.globalCompositeOperation = 'destination-in';
  const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 500);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.62, 'rgba(0,0,0,0.8)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeGround() {
  const tex = makeGridTexture();
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(380, 380),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: true })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.01, -52);
  mesh.renderOrder = -5;
  return mesh;
}

function makePlazas(anchors) {
  const group = new THREE.Group();
  const circleGeo = new THREE.CircleGeometry(1, 56);
  const ringGeo = new THREE.RingGeometry(0.985, 1, 72);
  anchors.forEach((a) => {
    const fill = new THREE.Mesh(
      circleGeo,
      new THREE.MeshBasicMaterial({ color: PALETTE.ice, transparent: true, opacity: 0.04, depthWrite: false })
    );
    fill.rotation.x = -Math.PI / 2;
    fill.scale.setScalar(a.radius ?? 6);
    fill.position.set(a.x, 0.03, a.z);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: PALETTE.ice, transparent: true, opacity: 0.22, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.scale.setScalar(a.radius ?? 6);
    ring.position.set(a.x, 0.04, a.z);
    group.add(fill, ring);
  });
  return group;
}

// Two ridges of low-poly peaks that silhouette against the horizon glow.
function makeMountains() {
  const group = new THREE.Group();
  const ridges = [
    { z: -152, spread: [40, 150], h: [16, 30], color: 0x0b1526, count: 14 },
    { z: -118, spread: [55, 140], h: [8, 16], color: 0x081120, count: 12 },
  ];
  ridges.forEach((ridge, ri) => {
    for (let i = 0; i < ridge.count; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const dist = ridge.spread[0] + seededRandom(i * 13 + ri * 71) * (ridge.spread[1] - ridge.spread[0]);
      const h = ridge.h[0] + Math.pow(seededRandom(i * 29 + ri * 17), 1.4) * (ridge.h[1] - ridge.h[0]);
      const r = h * (1.3 + seededRandom(i * 7 + ri) * 0.9);
      const peak = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 5, 1),
        new THREE.MeshBasicMaterial({ color: ridge.color, fog: true })
      );
      peak.position.set(side * dist, h / 2 - 0.5, ridge.z - seededRandom(i * 3 + ri) * 18);
      peak.rotation.y = seededRandom(i * 11 + ri) * Math.PI;
      group.add(peak);
    }
  });
  return group;
}

// Drifting snow — GPU-side motion, zero per-frame CPU work.
function makeSnow(count, isSpark = false) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (seededRandom(i * 5 + (isSpark ? 99 : 1)) - 0.5) * 90;
    positions[i * 3 + 1] = seededRandom(i * 5 + 2) * 17;
    positions[i * 3 + 2] = 24 - seededRandom(i * 5 + 3) * 170;
    seeds[i] = seededRandom(i * 5 + 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: isSpark ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: new THREE.Color(isSpark ? PALETTE.gold : 0xdfeefc) },
      uOpacity: { value: isSpark ? 0.5 : 0.36 },
      uDrift: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime; uniform float uPixelRatio; uniform float uDrift;
      varying float vFade;
      void main() {
        vec3 p = position;
        ${isSpark
          ? `p.y = mod(p.y + uTime * (0.25 + aSeed * 0.4) * uDrift, 17.0);`
          : `p.y = mod(p.y - uTime * (0.35 + aSeed * 0.5) * uDrift, 17.0);`}
        p.x += sin(uTime * (0.18 + aSeed * 0.1) + aSeed * 43.0) * 0.8 * uDrift;
        p.z += cos(uTime * 0.11 + aSeed * 71.0) * 0.5 * uDrift;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (${isSpark ? '1.0 + aSeed * 1.8' : '(1.2 + aSeed * 2.2)'}) * uPixelRatio * (58.0 / max(1.0, -mv.z));
        vFade = smoothstep(17.0, 12.0, p.y) * smoothstep(0.3, 2.0, p.y);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity;
      varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.06, d) * uOpacity * vFade;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  return new THREE.Points(geo, mat);
}

export function buildEnvironment({ anchors, pathPoints, quality }) {
  const group = new THREE.Group();

  const sky = makeSky();
  const aurora = makeAurora();
  const stars = makeStars(Math.round(quality.stars));
  const moon = makeMoon();
  const ground = makeGround();
  const plazas = makePlazas(anchors);
  const mountains = makeMountains();
  const snow = makeSnow(quality.dust, false);
  const sparks = makeSnow(Math.round(quality.dust * 0.07), true);

  group.add(sky, aurora, stars, moon, ground, plazas, mountains, snow, sparks);

  function update(t, dt, reducedMotion) {
    void dt;
    aurora.material.uniforms.uTime.value = t;
    if (!reducedMotion) {
      aurora.material.uniforms.uIntensity.value =
        0.92 + 0.18 * Math.sin(t * 0.21) * Math.sin(t * 0.077 + 1.7);
    }
    snow.material.uniforms.uTime.value = t;
    sparks.material.uniforms.uTime.value = t;
    stars.material.opacity = reducedMotion
      ? 0.6
      : 0.5 + 0.14 * Math.sin(t * 0.7);
  }

  function setQualityTier(tier) {
    const dpr = Math.min(window.devicePixelRatio, tier === 0 ? 2 : tier === 1 ? 1.5 : 1.25);
    snow.material.uniforms.uPixelRatio.value = dpr;
    sparks.material.uniforms.uPixelRatio.value = dpr;
    snow.geometry.setDrawRange(0, tier === 2 ? Math.floor(quality.dust * 0.5) : Infinity);
  }

  return { group, update, setQualityTier };
}
