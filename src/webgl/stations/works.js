import * as THREE from 'three';
import { mat, edgesOf, makeLabel } from '../materials.js';
import { makeIsland, bob } from './station-kit.js';
import { emit } from '../../core/state.js';

const INK = '#070d1a';
const PANEL = '#0d1626';
const LINE = '#22334c';
const BONE = '#e8f0f7';
const DIM = '#8fa3b8';
const ACCENT = '#6ee7f0';
const VIOLET = '#9d8cff';
const GOLD = '#ffcf87';
const MONO = '"IBM Plex Mono", monospace';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function screenBase(ctx, w, h, title) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, w, 38);
  ['#2c3a52', '#2c3a52', '#2c3a52'].forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(22 + i * 20, 19, 5, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });
  ctx.font = `500 15px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 84, 21);
}

// ---- Artifact 1: GRE quiz (in progress) ----------------------------------
function paintWip(ctx, w, h) {
  screenBase(ctx, w, h, 'gre-mcq · react · .net');

  ctx.font = `500 13px ${MONO}`;
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('IN PROGRESS', 28, 72);

  ctx.font = `400 19px ${MONO}`;
  ctx.fillStyle = BONE;
  ctx.fillText('Quiz platform —', 28, 104);
  ctx.fillText('shipping the last parts', 28, 130);

  // Two shipped, one still open — the open row stays hollow.
  const rows = [
    ['auth + quiz attempts', true],
    ['React question interface', true],
    ['admin panel', false],
  ];
  rows.forEach(([label, done], i) => {
    const ry = 168 + i * 34;
    rr(ctx, 28, ry, w - 56, 28, 6);
    if (done) {
      ctx.fillStyle = 'rgba(110,231,240,0.10)';
      ctx.fill();
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(40, ry + 14);
      ctx.lineTo(47, ry + 21);
      ctx.lineTo(58, ry + 7);
      ctx.stroke();
    } else {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(49, ry + 14, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.font = `400 14px ${MONO}`;
    ctx.fillStyle = done ? DIM : GOLD;
    ctx.fillText(label, 70, ry + 15);
  });

  const py = h - 34;
  ctx.fillStyle = '#131f36';
  ctx.fillRect(28, py, w - 56, 6);
  ctx.fillStyle = GOLD;
  ctx.fillRect(28, py, (w - 56) * 0.65, 6);
  ctx.font = `500 12px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.fillText('IN PRODUCTION', w - 150, py - 10);
}

// ---- Artifact 2: food delivery schema -------------------------------------
function tableBox(ctx, x, y, w, title, fields, hot) {
  const headH = 26;
  const rowH = 18;
  const bh = headH + fields.length * rowH + 8;
  rr(ctx, x, y, w, bh, 7);
  ctx.fillStyle = '#0c1424';
  ctx.fill();
  ctx.strokeStyle = hot ? ACCENT : LINE;
  ctx.lineWidth = hot ? 1.5 : 1;
  ctx.stroke();
  ctx.fillStyle = hot ? 'rgba(110,231,240,0.10)' : 'rgba(110,231,240,0.06)';
  rr(ctx, x, y, w, headH, 7);
  ctx.fill();
  ctx.font = `500 13px ${MONO}`;
  ctx.fillStyle = BONE;
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 12, y + headH / 2 + 1);
  ctx.font = `400 11px ${MONO}`;
  fields.forEach((f, i) => {
    ctx.fillStyle = f.startsWith('id') || f.startsWith('pk') ? ACCENT : DIM;
    ctx.fillText(f, x + 12, y + headH + rowH * i + rowH / 2 + 2);
  });
  return bh;
}

function link(ctx, pts, joint) {
  ctx.strokeStyle = '#2a3c58';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  joint.forEach(([jx, jy]) => {
    ctx.beginPath();
    ctx.arc(jx, jy, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.strokeStyle = VIOLET;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });
}

function paintSchema(ctx, w, h) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);
  ctx.font = `500 14px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('food_delivery · entity relationships', 28, 36);
  ctx.strokeStyle = LINE;
  ctx.beginPath(); ctx.moveTo(28, 48); ctx.lineTo(w - 28, 48); ctx.stroke();

  link(ctx, [[160, 120], [250, 120], [250, 96], [330, 96]], [[250, 120]]);
  link(ctx, [[160, 150], [330, 178]], []);
  link(ctx, [[100, 208], [100, 252], [210, 252]], [[100, 252]]);

  tableBox(ctx, 40, 92, 120, 'users', ['id  PK', 'name', 'address'], true);
  tableBox(ctx, 330, 66, 150, 'orders', ['id  PK', 'user_id FK', 'status'], false);
  tableBox(ctx, 330, 156, 150, 'order_items', ['order_id FK', 'menu_id FK'], false);
  tableBox(ctx, 40, 224, 130, 'menus', ['id  PK', 'category_id'], false);
  tableBox(ctx, 220, 232, 140, 'categories', ['id  PK', 'title'], false);
}

// ---- Artifact 3: responsive sites artboards --------------------------------
function artboard(ctx, x, y, w, hh, label, accent, variant) {
  rr(ctx, x, y, w, hh, 8);
  ctx.fillStyle = '#0a1322';
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.stroke();
  // browser chrome
  ctx.fillStyle = PANEL;
  rr(ctx, x, y, w, 20, 8);
  ctx.fill();
  ctx.fillStyle = '#2c3a52';
  ctx.beginPath(); ctx.arc(x + 12, y + 10, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 23, y + 10, 3.4, 0, Math.PI * 2); ctx.fill();
  rr(ctx, x + 34, y + 5, w - 48, 10, 5);
  ctx.fillStyle = '#16223a';
  ctx.fill();

  if (variant === 'gym') {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x + 14, y + 34, 54, 8);
    ctx.fillStyle = BONE;
    ctx.fillRect(x + 14, y + 50, w - 60, 12);
    ctx.fillRect(x + 14, y + 68, w - 90, 12);
    for (let i = 0; i < 3; i++) {
      rr(ctx, x + 14 + i * ((w - 28) / 3 + 4), y + 96, (w - 40) / 3, 52, 5);
      ctx.fillStyle = '#101a2e';
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.fillRect(x + 20 + i * ((w - 28) / 3 + 4), y + 104, 22, 6);
      ctx.fillStyle = DIM;
      ctx.fillRect(x + 20 + i * ((w - 28) / 3 + 4), y + 118, 30, 4);
    }
    ctx.fillStyle = DIM;
    ctx.fillRect(x + 14, y + hh - 34, w - 28, 20);
    ctx.fillStyle = '#0a1322';
    ctx.fillRect(x + 22, y + hh - 27, 40, 6);
  } else {
    ctx.fillStyle = accent;
    ctx.fillRect(x + 14, y + 34, w - 90, 10);
    ctx.fillStyle = BONE;
    ctx.fillRect(x + 14, y + 52, w - 130, 8);
    ctx.fillRect(x + 14, y + 66, w - 110, 8);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        rr(ctx, x + 14 + c * 44, y + 88 + r * 54, 36, 44, 4);
        ctx.fillStyle = r === 0 && c === 1 ? 'rgba(157,140,255,0.28)' : '#101a2e';
        ctx.fill();
        ctx.strokeStyle = LINE;
        ctx.stroke();
      }
    }
  }
  ctx.font = `500 11px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.fillText(label, x, y + hh + 16);
}

function paintSites(ctx, w, h) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);
  ctx.font = `500 14px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('responsive sets · component-first', 28, 34);
  artboard(ctx, 36, 58, 128, 190, 'GYM SITE', ACCENT, 'gym');
  artboard(ctx, 196, 58, 128, 190, 'BOOK CLUB', VIOLET, 'club');
  artboard(ctx, 356, 58, 128, 190, 'MOBILE VIEW', ACCENT, 'gym');
}

// ---- artifact assembly ------------------------------------------------------

function canvasTexture(paintFn) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  paintFn(ctx, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeArtifact({ x, y, z, ry, title, paint, project }) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;

  const frameGeo = new THREE.BoxGeometry(2.7, 1.8, 0.1);
  const frame = new THREE.Mesh(frameGeo, mat.slab);
  const frameEdges = edgesOf(frameGeo);
  const tex = canvasTexture(paint);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.82,
    roughness: 0.85,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.56, 1.68), screenMat);
  screen.position.z = 0.056;

  const backScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.56, 1.68),
    new THREE.MeshBasicMaterial({ color: 0x0e1512 })
  );
  backScreen.rotation.y = Math.PI;
  backScreen.position.z = -0.056;

  const label = makeLabel(title, { size: 24, color: '#c3d2e2', worldHeight: 0.27 });
  label.position.y = -1.32;

  g.add(frame, frameEdges, screen, backScreen, label);

  const updateBob = bob(g, { baseY: y, amp: 0.09, speed: 0.8, phase: x });

  let hovered = false;
  const hoverable = {
    objects: [frame, screen],
    label: `${project.title}${project.status === 'wip' ? ' — in progress' : ' — open details'}`,
    onHover(active) {
      hovered = active;
      frameEdges.material = active ? mat.edgeAccent : mat.edgeIce;
      screenMat.emissiveIntensity = active ? 1.15 : 0.82;
      document.body.dataset.cursor = active ? 'pointer' : 'default';
    },
    onClick() {
      emit('open-project', project);
    },
  };

  return {
    group: g,
    hoverable,
    update(t, dt, rm) {
      updateBob(t);
      const targetLift = hovered ? 0.22 : 0;
      g.userData.lift = (g.userData.lift ?? 0) + (targetLift - (g.userData.lift ?? 0)) * Math.min(1, dt * 6);
      g.position.y += g.userData.lift * (rm ? 0 : 1);
      if (!rm) g.rotation.y = ry + Math.sin(t * 0.5 + x) * 0.03;
    },
  };
}

export function buildWorks({ projects }) {
  const group = new THREE.Group();
  group.position.set(-10, 0, -74);

  const specs = [
    { x: -3.9, y: 2.75, z: 0.9, ry: 0.45, paint: paintWip, p: projects[0] },
    { x: 0, y: 3.25, z: -0.6, ry: 0, paint: paintSchema, p: projects[1] },
    { x: 3.9, y: 2.75, z: 0.9, ry: -0.45, paint: paintSites, p: projects[2] },
  ];

  const artifacts = specs.map((s) =>
    makeArtifact({
      x: s.x, y: s.y, z: s.z, ry: s.ry,
      title: s.p.short,
      paint: s.paint,
      project: s.p,
    })
  );

  const island = makeIsland(13, 10);

  const label = makeLabel('02 · WORKS', { size: 30, accent: '#6ee7f0', worldHeight: 0.36 });
  label.position.set(0, 1.0, 6.6);

  group.add(island, label);
  artifacts.forEach((a) => group.add(a.group));

  function update(t, dt, rm) {
    artifacts.forEach((a) => a.update(t, dt, rm));
  }

  return { group, update, hoverables: artifacts.map((a) => a.hoverable) };
}
