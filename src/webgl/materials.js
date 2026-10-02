import * as THREE from 'three';

// Aurora Nightfall palette — deep midnight, ice cyan, soft violet, lantern gold.
export const PALETTE = {
  ink: 0x070d1a,
  ink2: 0x0b1322,
  slab: 0x101a2c,
  slabEdge: 0x24344d,
  bone: 0xe8f0f7,
  boneDim: 0x8fa3b8,
  ice: 0x6ee7f0,
  iceHot: 0xbff6ff,
  violet: 0x9d8cff,
  gold: 0xffcf87,
};

// Shared geometry cache — keeps the scene light on GPU buffers.
const geoCache = new Map();
export function sharedGeo(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

export const geo = {
  box: () => sharedGeo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  sphere: () => sharedGeo('sph', () => new THREE.SphereGeometry(1, 20, 14)),
  octa: () => sharedGeo('octa', () => new THREE.OctahedronGeometry(1, 0)),
};

export const mat = {
  slab: new THREE.MeshStandardMaterial({ color: PALETTE.slab, roughness: 0.9, metalness: 0.12 }),
  bone: new THREE.MeshStandardMaterial({ color: PALETTE.bone, roughness: 0.5, metalness: 0.08 }),
  ice: new THREE.MeshStandardMaterial({
    color: PALETTE.ice, roughness: 0.22, metalness: 0.45,
    emissive: PALETTE.ice, emissiveIntensity: 0.12,
  }),
  accentGlow: new THREE.MeshBasicMaterial({ color: PALETTE.ice }),
  goldGlow: new THREE.MeshBasicMaterial({ color: PALETTE.gold }),
  edgeIce: new THREE.LineBasicMaterial({ color: PALETTE.ice, transparent: true, opacity: 0.5 }),
  edgeAccent: new THREE.LineBasicMaterial({ color: PALETTE.gold, transparent: true, opacity: 0.85 }),
};

export function edgesOf(geometry, material = mat.edgeIce) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geometry), material);
}

/**
 * Canvas-drawn text label rendered as a Sprite (always faces the camera).
 * Callers must dispose() the returned object to free textures.
 */
export function makeLabel(text, {
  size = 26,
  color = '#e8f0f7',
  accent = null,
  worldHeight = 0.42,
  letterSpacing = 6,
} = {}) {
  const canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  const font = `500 ${size}px "IBM Plex Mono", monospace`;
  ctx.font = font;
  const textWidth = ctx.measureText(text).width;
  canvas.width = Math.ceil(textWidth + letterSpacing * text.length + 80);
  canvas.height = Math.ceil(size * 2.4);

  // Resizing the canvas resets its context state — reapply font settings.
  ctx = canvas.getContext('2d');
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  if (accent) {
    ctx.fillStyle = accent;
    ctx.fillRect(18, canvas.height / 2 - 3, 11, 6);
  }
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(4,8,16,0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(worldHeight * aspect, worldHeight, 1);
  return sprite;
}
