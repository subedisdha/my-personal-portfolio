// Centralised input: wheel / touch / keyboard drive the journey,
// pointer position feeds parallax + raycasting.
import { state, goTo, SECTIONS, emit } from './state.js';
import { clamp } from '../utils/math.js';

export const input = {
  px: 0, // normalized pointer -1..1
  py: 0,
  lastInteraction: 0,
  dragging: false,
};

let dragStart = { x: 0, y: 0, t: 0 };
let dragLast = { x: 0, y: 0 };

function markInteraction() {
  input.lastInteraction = performance.now();
}

export function initInput(domElement) {
  // ---- wheel -------------------------------------------------------------
  window.addEventListener(
    'wheel',
    (e) => {
      if (!state.entered || state.modalOpen) return;
      const scroller = e.target.closest?.('[data-scrollable]');
      if (scroller && scroller.scrollHeight > scroller.clientHeight + 2) {
        const atTop = scroller.scrollTop <= 0;
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
      }
      e.preventDefault();
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // ignore horizontal trackpad
      const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      state.target = clamp(state.target + d * 0.00062, 0, SECTIONS.length - 1);
      emit('input-delta', d);
      markInteraction();
    },
    { passive: false }
  );

  // ---- touch (swipe = travel) --------------------------------------------
  domElement.addEventListener(
    'touchstart',
    (e) => {
      if (!state.entered) return;
      const t = e.touches[0];
      dragStart = { x: t.clientX, y: t.clientY, t: performance.now() };
      dragLast = { x: t.clientX, y: t.clientY };
      input.dragging = true;
    },
    { passive: true }
  );

  domElement.addEventListener(
    'touchmove',
    (e) => {
      if (!input.dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - dragLast.x;
      const dy = t.clientY - dragLast.y;
      dragLast = { x: t.clientX, y: t.clientY };
      // Vertical swipes travel the journey; horizontal drags do nothing.
      if (Math.abs(dy) > Math.abs(dx) * 1.4) {
        state.target = clamp(state.target - dy * 0.0034, 0, SECTIONS.length - 1);
        markInteraction();
      }
    },
    { passive: true }
  );

  domElement.addEventListener('touchend', () => {
    input.dragging = false;
    const dt = performance.now() - dragStart.t;
    const dy = dragLast.y - dragStart.y;
    // Fast flick -> snap to next/prev station.
    if (dt < 320 && Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dragLast.x - dragStart.x) * 1.4) {
      goTo(Math.round(state.target) + (dy < 0 ? 1 : -1));
    }
    markInteraction();
  });

  // ---- keyboard -----------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    if (!state.entered) return;
    if (state.modalOpen) {
      if (e.key === 'Escape') emit('modal-close');
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        goTo(state.index + 1);
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        goTo(state.index - 1);
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(SECTIONS.length - 1);
        break;
      default:
        if (/^[0-5]$/.test(e.key)) goTo(Number(e.key));
    }
    markInteraction();
  });

  // ---- pointer ------------------------------------------------------------
  window.addEventListener(
    'pointermove',
    (e) => {
      input.px = (e.clientX / window.innerWidth) * 2 - 1;
      input.py = (e.clientY / window.innerHeight) * 2 - 1;
      emit('pointer-move', { x: e.clientX, y: e.clientY });
    },
    { passive: true }
  );

  let downAt = null;
  domElement.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY };
    markInteraction();
  });
  domElement.addEventListener(
    'pointerup',
    (e) => {
      if (!downAt) return;
      const dist = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
      downAt = null;
      if (dist < 8 && state.entered && !state.modalOpen) {
        emit('tap', { x: e.clientX, y: e.clientY });
      }
    },
    { passive: true }
  );
}
