import * as THREE from 'three';
import { mat, edgesOf, makeLabel } from '../materials.js';
import { makeIsland } from './station-kit.js';
import { emit } from '../../core/state.js';

const MONO = '"IBM Plex Mono", monospace';
const BONE = '#e8f0f7';
const DIM = '#6d8098';
const ICE = '#6ee7f0';
const GOLD = '#ffcf87';

function paintEditor(ctx, w, h) {
  ctx.fillStyle = '#070d1a';
  ctx.fillRect(0, 0, w, h);
  // tab bar
  ctx.fillStyle = '#0d1626';
  ctx.fillRect(0, 0, w, 34);
  ctx.fillStyle = '#16223a';
  ctx.fillRect(16, 6, 190, 26);
  ctx.font = `500 13px ${MONO}`;
  ctx.fillStyle = BONE;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('home.blade.php', 30, 20);
  ctx.fillStyle = DIM;
  ctx.fillText('routes/web.php', 226, 20);
  // gutter + code bars
  const rows = 11;
  const colors = [ICE, '#4d607c', GOLD, BONE, '#4d607c', ICE];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let cursorX = 52;
  for (let i = 0; i < rows; i++) {
    const y = 56 + i * 21;
    ctx.fillStyle = '#3a4c68';
    ctx.fillText(String(i + 1).padStart(2, ' '), 14, y);
    const indent = 52 + Math.floor(rnd() * 2) * 22;
    cursorX = indent;
    let x = indent;
    const segs = 1 + Math.floor(rnd() * 3);
    for (let sIdx = 0; sIdx < segs; sIdx++) {
      const wBar = 24 + rnd() * 90;
      ctx.fillStyle = colors[Math.floor(rnd() * colors.length)];
      ctx.globalAlpha = 0.75;
      ctx.fillRect(x, y - 5, wBar, 9);
      ctx.globalAlpha = 1;
      x += wBar + 12;
      if (x > w - 60) break;
    }
  }
  // cursor
  ctx.fillStyle = ICE;
  ctx.fillRect(cursorX + 8, 56 + rows * 21 - 19, 8, 14);
}

function paintFlag(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#101a30');
  grad.addColorStop(1, '#070d1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(110,231,240,0.55)';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = ICE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 44px ${MONO}`;
  ctx.fillText('OSM', w / 2, h / 2 - 34);
  ctx.fillText('HACKFEST', w / 2, h / 2 + 12);
  ctx.font = `500 24px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.fillText('· 2023 ·', w / 2, h / 2 + 50);
}

export function buildPath({ reducedMotion }) {
  const group = new THREE.Group();
  group.position.set(13, 0, -96);

  const island = makeIsland(13, 11);

  // ---- workstation ---------------------------------------------------------
  const deskGeo = new THREE.BoxGeometry(3.2, 0.14, 1.7);
  const desk = new THREE.Mesh(deskGeo, mat.slab);
  desk.position.set(-2.3, 1.16, -1);
  const deskEdges = edgesOf(deskGeo);
  deskEdges.position.copy(desk.position);

  [
    [-3.6, -1.6], [-1.0, -1.6], [-3.6, -0.4], [-1.0, -0.4],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.16, 0.08), mat.slab);
    leg.position.set(lx, 0.58, lz);
    group.add(leg);
  });

  const editorTexCanvas = document.createElement('canvas');
  editorTexCanvas.width = 480;
  editorTexCanvas.height = 300;
  paintEditor(editorTexCanvas.getContext('2d'), 480, 300);
  const editorTex = new THREE.CanvasTexture(editorTexCanvas);
  editorTex.colorSpace = THREE.SRGBColorSpace;

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: 0xffffff, emissiveMap: editorTex,
    emissiveIntensity: 0.85, roughness: 0.85,
  });
  const monitor = new THREE.Group();
  monitor.position.set(-2.3, 1.95, -1.25);
  const bezelGeo = new THREE.BoxGeometry(1.85, 1.18, 0.07);
  const bezel = new THREE.Mesh(bezelGeo, mat.slab);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 1.06), screenMat);
  screen.position.z = 0.045;
  const standBar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.07), mat.slab);
  standBar.position.y = -0.72;
  monitor.add(bezel, edgesOf(bezelGeo), screen, standBar);

  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.34), mat.bone);
  kb.position.set(-2.42, 1.28, -0.62);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.18, 14),
    new THREE.MeshStandardMaterial({ color: 0xffcf87, roughness: 0.55 }));
  mug.position.set(-1.32, 1.32, -0.66);

  const deskLabel = makeLabel('FRONTEND INTERN · DIGITAL YETI', {
    size: 22, color: '#c3d2e2', worldHeight: 0.24,
  });
  deskLabel.position.set(-2.3, 0.5, 0.6);

  // ---- hackfest monument -----------------------------------------------------
  const plinthGeo = new THREE.BoxGeometry(1.5, 0.55, 1.5);
  const plinth = new THREE.Mesh(plinthGeo, mat.slab);
  plinth.position.set(2.6, 0.27, -0.3);
  const plinthEdges = edgesOf(plinthGeo);
  plinthEdges.position.copy(plinth.position);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.1, 10), mat.bone);
  pole.position.set(2.6, 2.1, -0.3);

  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 256;
  flagCanvas.height = 160;
  paintFlag(flagCanvas.getContext('2d'), 256, 160);
  const flagTex = new THREE.CanvasTexture(flagCanvas);
  flagTex.colorSpace = THREE.SRGBColorSpace;

  const flagPivot = new THREE.Group();
  flagPivot.position.set(2.63, 3.35, -0.3);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.94),
    new THREE.MeshStandardMaterial({
      map: flagTex, side: THREE.DoubleSide, roughness: 0.8,
      emissive: 0xffffff, emissiveMap: flagTex, emissiveIntensity: 0.22,
    })
  );
  flag.position.x = 0.76;
  flagPivot.add(flag);

  const achLabel = makeLabel('TEAM LEADER', {
    size: 22, color: '#ffcf87', worldHeight: 0.23,
  });
  achLabel.position.set(2.6, 0.16, 0.75);

  const stationLabel = makeLabel('03 · PATH', { size: 30, accent: '#6ee7f0', worldHeight: 0.36 });
  stationLabel.position.set(0, 1.0, 6.8);

  group.add(island, desk, deskEdges, monitor, kb, mug, deskLabel,
    plinth, plinthEdges, pole, flagPivot, achLabel, stationLabel);

  let flagHover = false;
  let monitorHover = false;

  function update(t, dt) {
    void dt;
    if (!reducedMotion) {
      flag.rotation.y = Math.sin(t * 1.7) * 0.16;
      flagPivot.rotation.y = Math.sin(t * 0.6) * 0.06;
      monitor.rotation.y = Math.sin(t * 0.4) * 0.02;
    }
    screenMat.emissiveIntensity = monitorHover ? 1.15 : 0.85;
    flag.material.emissiveIntensity = flagHover ? 0.6 : 0.22;
  }

  const hoverables = [
    {
      objects: [bezel, screen, desk],
      label: 'internship — digital yeti',
      onHover(a) { monitorHover = a; },
      onClick() { emit('open-detail', { type: 'experience' }); },
    },
    {
      objects: [flag],
      label: 'OSM Hackfest 2023 — team leader',
      onHover(a) {
        flagHover = a;
        document.body.dataset.cursor = a ? 'pointer' : 'default';
      },
      onClick() { emit('open-detail', { type: 'achievement' }); },
    },
  ];

  return { group, update, hoverables };
}
