import { state, on } from '../core/state.js';
import { el } from '../utils/dom.js';

// Custom cursor: a bone dot with a lagging ring. Desktop pointers only,
// and disabled entirely under prefers-reduced-motion.
export function initCursor() {
  if (state.isTouch || state.reducedMotion) return;

  document.body.classList.add('has-cursor');

  const dot = el('#cursor-dot');
  const ring = el('#cursor-ring');
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let rx = x;
  let ry = y;

  on('pointer-move', ({ x: nx, y: ny }) => {
    x = nx;
    y = ny;
    dot.style.transform = `translate(${nx}px, ${ny}px)`;
  });

  (function loop() {
    rx += (x - rx) * 0.16;
    ry += (y - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  })();

  // Grow the ring over interactive DOM elements.
  const INTERACTIVE = 'button, a[href], .chip, .work-row';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(INTERACTIVE)) document.body.dataset.cursor = 'pointer';
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(INTERACTIVE)) document.body.dataset.cursor = 'default';
  });
}
