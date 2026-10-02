import { state, on, goTo, SECTIONS } from '../core/state.js';
import { el } from '../utils/dom.js';

const LABELS = ['Origin', 'Identity', 'Skills', 'Works', 'Path', 'Contact'];

export function initHud({ flat, soundscape }) {
  const rail = el('#rail');
  const readout = el('#hud-readout');
  let baseLabel = '[00] ORIGIN';
  let pct = 0;

  rail.innerHTML = LABELS.map((label, i) => `
    <button type="button" class="rail__item" data-goto="${i}" aria-label="Go to station ${i}: ${label}">
      <span class="rail__num mono" aria-hidden="true">0${i}</span>
      <span class="rail__tick" aria-hidden="true"></span>
      <span class="rail__label">${label}</span>
    </button>
  `).join('');

  function setActive(idx) {
    rail.querySelectorAll('.rail__item').forEach((btn, i) => {
      btn.classList.toggle('is-active', i === idx);
      if (i === idx) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
  }

  function renderReadout() {
    readout.textContent = `${baseLabel} · ${String(pct).padStart(2, '0')}%`;
  }

  setActive(0);
  renderReadout();
  on('index', (idx) => {
    setActive(idx);
    baseLabel = `[0${idx}] ${SECTIONS[idx].toUpperCase()}`;
    renderReadout();
  });

  // One delegated listener drives every [data-goto] control (wordmark, rail).
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-goto]');
    if (!target) return;
    e.preventDefault();
    const i = Number(target.dataset.goto);
    if (i === 1) soundscape?.mechLoad(); // "Begin the walk" — load the next station
    goTo(i);
    if (flat) {
      document
        .querySelector(`.panel--${SECTIONS[i]}`)
        ?.scrollIntoView({ behavior: state.reducedMotion ? 'auto' : 'smooth' });
    }
  });

  el('#arrow-prev').addEventListener('click', () => goTo(state.index - 1));
  el('#arrow-next').addEventListener('click', () => goTo(state.index + 1));

  return {
    updateProgress(floatValue) {
      pct = Math.round((floatValue / (LABELS.length - 1)) * 100);
      renderReadout();
    },
  };
}
