export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const lerp = (a, b, t) => a + (b - a) * t;

export const invLerp = (a, b, v) => (b - a === 0 ? 0 : (v - a) / (b - a));

// Frame-rate independent exponential damping.
export const damp = (current, target, lambda, dt) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export const smoothstep = (t) => t * t * (3 - 2 * t);

export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

// Deterministic pseudo-random from an integer seed (stable scatter layouts).
export const seededRandom = (seed) => {
  let s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
