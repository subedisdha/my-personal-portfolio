import { state, on } from './state.js';
import { initInput } from './input.js';
import { createWorld } from '../webgl/world.js';
import { initBoot } from '../ui/boot.js';
import { initHud } from '../ui/hud.js';
import { initPanels } from '../ui/panels.js';
import { initModal } from '../ui/modal.js';
import { initCursor } from '../ui/cursor.js';
import { createSoundscape, initAudioToggle } from '../ui/audio.js';
import { el, toast } from '../utils/dom.js';

function waitForFonts(timeoutMs = 1800) {
  const done = Promise.resolve(document.fonts?.ready);
  return Promise.race([done, new Promise((r) => setTimeout(r, timeoutMs))]);
}

export async function startApp() {
  await waitForFonts();

  const world = createWorld(el('#stage'));
  const flat = !world;
  if (flat) document.body.classList.add('flat');

  if (!flat) {
    initInput(world.domElement);
    window.addEventListener('resize', () => world.resize());
    world.onContextLost(() =>
      toast('graphics context lost — if the scene froze, a reload will bring it back')
    );
  }

  const soundscape = createSoundscape();
  initAudioToggle(soundscape);

  initModal();
  const panelsApi = initPanels({ flat });
  const hud = initHud({ flat, soundscape });
  initCursor();

  // Tooltip follows the pointer and mirrors 3D hover state.
  if (!flat) {
    const tooltip = el('#tooltip');
    on('hover-label', (label) => {
      tooltip.textContent = label ?? '';
      tooltip.classList.toggle('is-visible', Boolean(label));
    });
    on('pointer-move', ({ x, y }) => {
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });
  }

  // 3D hover feedback -> sound
  let lastHoverLabel = null;
  on('hover-label', (label) => {
    if (label && label !== lastHoverLabel && !state.reducedMotion) soundscape.blipHover();
    lastHoverLabel = label;
  });
  on('arrived', () => {
    if (!state.reducedMotion) soundscape.blipStation();
  });

  // UI skill chips -> pulse the matching constellation cluster
  window.addEventListener('skill-ui-select', (e) => {
    world?.skillsStation?.highlightFromUI(e.detail);
  });

  // First-visit orientation nudge
  on('entered', () => {
    setTimeout(() => {
      if (!state.reducedMotion) {
        toast(flat ? 'use the station list to explore' : 'scroll to travel · click what glows');
      }
    }, 900);
  });

  initBoot(soundscape, () => {
    if (flat) document.querySelector('.panel--origin')?.scrollIntoView();
  });

  // ---- main loop ------------------------------------------------------------
  if (!flat) {
    let rafId = null;
    let frames = 0;
    let lastCheck = performance.now();
    let lowStreak = 0;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (document.hidden) {
        lastCheck = performance.now();
        return;
      }
      world.update();
      panelsApi.update(state.float);
      hud.updateProgress(state.float);

      // FPS watchdog over rolling 2s windows — degrade quality if we
      // cannot hold roughly 38fps twice in a row.
      frames += 1;
      const now = performance.now();
      if (now - lastCheck >= 2000) {
        const fps = Math.round((frames * 1000) / (now - lastCheck));
        if (fps < 38) lowStreak += 1;
        else lowStreak = 0;
        if (lowStreak >= 2) {
          world.degrade();
          lowStreak = 0;
        }
        frames = 0;
        lastCheck = now;
      }
    };
    tick();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (rafId === null) {
        lastCheck = performance.now();
        tick();
      }
    });
  }

  // Keep mobile flag fresh (orientation changes).
  window.addEventListener('resize', () => {
    state.isMobile = window.innerWidth < 768;
  });
}
