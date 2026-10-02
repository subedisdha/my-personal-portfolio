import { state, on } from '../core/state.js';
import { el, escapeHtml } from '../utils/dom.js';
import { experience, achievement, profile } from '../data/content.js';

let lastFocus = null;

function stackChips(stack) {
  return `<div class="modal__stack mono">${stack.map((s) => `<span>${s}</span>`).join('')}</div>`;
}

function projectTemplate(p) {
  return `
    <p class="modal__kicker mono">${p.index} · project artifact</p>
    <h2 class="modal__title" id="modal-title">${escapeHtml(p.title)}</h2>
    <p class="modal__tagline">${escapeHtml(p.tagline)}</p>
    ${p.status === 'wip' ? `<p class="modal__status mono">${escapeHtml(p.statusNote)}</p>` : ''}
    ${stackChips(p.stack)}
    <h3 class="modal__sub">What I built</h3>
    <ul class="ticks">
      ${p.points.map((pt) => `<li>${pt}</li>`).join('')}
    </ul>
    <h3 class="modal__sub">My role</h3>
    <p class="body-copy">${escapeHtml(p.role)}</p>
    <p class="modal__note mono">source available on request — reach me through the contact station</p>`;
}

function experienceTemplate() {
  return `
    <p class="modal__kicker mono">internship · ${experience.duration}</p>
    <h2 class="modal__title" id="modal-title">${experience.role}</h2>
    <p class="modal__tagline">${experience.org}</p>
    <h3 class="modal__sub">Responsibilities</h3>
    <ul class="ticks">${experience.points.map((pt) => `<li>${pt}</li>`).join('')}</ul>
    <p class="modal__note mono">where the frontend met the backend</p>`;
}

function achievementTemplate() {
  return `
    <p class="modal__kicker mono">achievement · team leader</p>
    <h2 class="modal__title" id="modal-title">${achievement.title}</h2>
    <p class="modal__tagline">Led the team through the hackathon build.</p>
    <ul class="ticks">${achievement.points.map((pt) => `<li>${pt}</li>`).join('')}</ul>
    <div class="stamp stamp--modal mono" aria-hidden="true">TEAM&nbsp;LEADER</div>`;
}

function qrTemplate() {
  const data = encodeURIComponent(`mailto:${profile.email}`);
  return `
    <p class="modal__kicker mono">05 · transmission</p>
    <h2 class="modal__title" id="modal-title">Scan the channel</h2>
    <p class="modal__tagline">Point any phone camera at the code — it opens a mail to <a href="mailto:${profile.email}">${profile.email}</a>.</p>
    <img class="modal__qr" src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=6&data=${data}" alt="QR code for ${profile.email}" width="260" height="260" />
    <p class="modal__note mono">no pen, no paper — just point and send</p>`;
}

export function initModal() {
  const modal = el('#modal');
  const body = el('#modal-body');
  const closeBtn = el('#modal-close');

  function renderOpen(html) {
    lastFocus = document.activeElement;
    body.innerHTML = html;
    modal.hidden = false;
    state.modalOpen = true;
    document.body.dataset.cursor = 'default';
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      closeBtn.focus({ preventScroll: true });
    });
  }

  function close() {
    if (!state.modalOpen) return;
    modal.classList.remove('is-open');
    state.modalOpen = false;
    setTimeout(() => { modal.hidden = true; }, 320);
    if (lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
  }

  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-modal-close]')) close();
  });

  // Simple focus containment while open.
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !state.modalOpen) return;
    const focusables = modal.querySelectorAll('button, a[href]');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  const api = {
    openProject: (p) => renderOpen(projectTemplate(p)),
    openDetail: ({ type }) =>
      renderOpen(type === 'achievement' ? achievementTemplate() : experienceTemplate()),
    openQr: () => renderOpen(qrTemplate()),
    close,
  };

  on('open-project', api.openProject);
  on('open-detail', api.openDetail);
  on('open-qr', api.openQr);
  on('modal-close', () => api.close());

  return api;
}
