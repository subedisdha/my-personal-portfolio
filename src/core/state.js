// Tiny pub/sub state store shared by the WebGL side and the UI side.
import { clamp } from '../utils/math.js';

export const SECTIONS = ['origin', 'identity', 'skills', 'works', 'path', 'contact'];

const listeners = new Map(); // event -> Set<fn>

export const state = {
  float: 0, // continuous position along the journey [0..SECTIONS-1]
  target: 0,
  index: 0, // nearest station index
  entered: false,
  modalOpen: false,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isTouch: window.matchMedia('(pointer: coarse)').matches,
  isMobile: window.innerWidth < 768,
};

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event).delete(fn);
}

export function emit(event, payload) {
  const set = listeners.get(event);
  if (set) set.forEach((fn) => fn(payload));
}

export function setFloat(v) {
  state.float = clamp(v, 0, SECTIONS.length - 1);
  const idx = Math.round(state.float);
  if (idx !== state.index) {
    state.index = idx;
    emit('section', SECTIONS[idx]);
    emit('index', idx);
  }
  emit('float', state.float);
}

export function goTo(i, { instant = false } = {}) {
  const clamped = clamp(Math.round(i), 0, SECTIONS.length - 1);
  if (instant || state.reducedMotion) {
    state.target = clamped;
    setFloat(clamped);
    emit('arrived', clamped);
    return;
  }
  state.target = clamped;
}
