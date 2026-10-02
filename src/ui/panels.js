import { state, on, emit } from '../core/state.js';
import { el, toast } from '../utils/dom.js';
import { about, skills, projects, experience, achievement, profile } from '../data/content.js';

function factsHtml(facts) {
  return `<dl class="facts">${facts.map(([k, v]) => `
    <div class="facts__row"><dt class="mono">${k}</dt><dd>${v}</dd></div>`).join('')}
  </dl>`;
}

const templates = {
  origin: () => `
    <section class="panel panel--origin" aria-label="Introduction">
      <div class="panel__inner panel__inner--center">
        <p class="kicker mono">portfolio system · kathmandu, nepal</p>
        <h1 class="hero-name">Shraddha<br /><em>Subedi</em></h1>
        <p class="lede">Frontend &amp; Laravel developer. I build web applications that work well — and I put together this small valley to walk you through mine.</p>
        <div class="origin__actions">
          <button type="button" class="btn btn--solid" data-goto="1">Begin the walk</button>
          <button type="button" class="btn btn--ghost" id="download-resume">Download résumé</button>
        </div>
      </div>
    </section>`,

  identity: () => `
    <section class="panel panel--identity" aria-label="About Shraddha">
      <div class="panel__inner">
        <header class="panel__head"><h2>Identity</h2><span class="panel__index mono">01</span></header>
        ${about.paragraphs.map((p) => `<p class="body-copy">${p}</p>`).join('')}
        ${factsHtml(about.facts)}
      </div>
    </section>`,

  skills: () => `
    <section class="panel panel--skills" aria-label="Skills">
      <div class="panel__inner">
        <header class="panel__head"><h2>Skills</h2><span class="panel__index mono">02</span></header>
        <p class="panel__note body-copy">The constellation across the water holds every tool I use. Hover its nodes — or pick a group here.</p>
        <div class="chips" id="skill-chips">
          ${skills.map((c, i) => `
            <button type="button" class="chip mono${i === 0 ? ' is-active' : ''}" data-cat="${i}" aria-pressed="${i === 0}">${c.group}</button>`).join('')}
        </div>
        <div class="skill-detail">
          <p class="skill-blurb mono" id="skill-blurb">${skills[0].blurb}</p>
          <ul class="skill-items" id="skill-items">
            ${skills[0].items.map((it) => `<li>${it}</li>`).join('')}
          </ul>
        </div>
      </div>
    </section>`,

  works: () => `
    <section class="panel panel--works" aria-label="Projects">
      <div class="panel__inner">
        <header class="panel__head"><h2>Selected works</h2><span class="panel__index mono">03</span></header>
        <p class="panel__note body-copy">Three artifacts float at this station — one is still in progress. Open one here, or reach out and touch it.</p>
        <div class="work-rows">
          ${projects.map((p, i) => `
            <button type="button" class="work-row" data-project="${i}">
              <span class="work-row__index mono">${p.index}</span>
              <span class="work-row__main">
                <span class="work-row__title">${p.title}</span>
                <span class="work-row__stack mono">${p.stack.join(' · ')}</span>
              </span>
              ${p.status === 'wip' ? `<span class="work-row__status mono">IN PROGRESS</span>` : ''}
              <span class="work-row__arrow" aria-hidden="true">→</span>
            </button>`).join('')}
        </div>
      </div>
    </section>`,

  path: () => `
    <section class="panel panel--path" aria-label="Experience and achievements">
      <div class="panel__inner">
        <header class="panel__head"><h2>The path so far</h2><span class="panel__index mono">04</span></header>

        <article class="card card--xp">
          <p class="card__kicker mono">internship · ${experience.duration}</p>
          <h3>${experience.role} — ${experience.org}</h3>
          <ul class="ticks">
            ${experience.points.map((pt) => `<li>${pt}</li>`).join('')}
          </ul>
          <button type="button" class="link-btn mono" data-detail="experience">open in viewer →</button>
        </article>

        <article class="card card--award">
          <div class="stamp mono" aria-hidden="true">TEAM&nbsp;LEADER</div>
          <p class="card__kicker mono">achievement</p>
          <h3>${achievement.title}</h3>
          <ul class="ticks">
            ${achievement.points.map((pt) => `<li>${pt}</li>`).join('')}
          </ul>
          <button type="button" class="link-btn mono" data-detail="achievement">open in viewer →</button>
        </article>
      </div>
    </section>`,

  contact: () => `
    <section class="panel panel--contact" aria-label="Contact">
      <div class="panel__inner panel__inner--center">
        <p class="kicker mono">05 · transmission</p>
        <h2 class="contact-title">Open a channel</h2>
        <a class="contact-email" href="mailto:${profile.email}">${profile.email}</a>
        <div class="contact-actions">
          <button type="button" class="btn btn--solid" id="copy-email">Copy email</button>
          <button type="button" class="btn btn--ghost" id="show-qr">Show QR</button>
        </div>
        <div class="contact-links mono">
          <a href="${profile.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <span aria-hidden="true">/</span>
          <a href="${profile.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        </div>
        <p class="contact-meta mono">BSc.CSIT · Tribhuvan University · 2023 · ${profile.location}</p>
      </div>
    </section>`,
};

function resumeText() {
  const lines = [
    `${profile.name} — ${profile.role}`,
    `Based in ${profile.location}.`,
    `Email: ${profile.email}`,
    `GitHub: ${profile.github} | LinkedIn: ${profile.linkedin}`,
    '',
    'ABOUT',
    ...about.paragraphs,
    '',
    'SKILLS',
    ...skills.map((c) => `${c.group} — ${c.items.join(', ')}`),
    '',
    'PROJECTS',
    ...projects.map((p) => [
      `${p.title} · ${p.stack.join(', ')}${p.status === 'wip' ? '  [IN PROGRESS]' : ''}`,
      ...p.points.map((pt) => `  - ${pt}`),
      `  Role: ${p.role}`,
      ...(p.status === 'wip' ? [`  Status: ${p.statusNote}`] : []),
    ].join('\n')),
    '',
    'EXPERIENCE',
    `${experience.role}, ${experience.org} (${experience.duration})`,
    ...experience.points.map((pt) => `  - ${pt}`),
    '',
    'ACHIEVEMENT',
    `${achievement.title} — ${achievement.role}`,
    ...achievement.points.map((pt) => `  - ${pt}`),
  ];
  return lines.join('\n');
}

function buildResume() {
  const aside = document.createElement('aside');
  aside.id = 'resume';
  aside.className = 'sr-only';
  aside.setAttribute('aria-label', 'Plain text résumé');
  aside.innerHTML = `
    <h2>About</h2>
    ${about.paragraphs.map((p) => `<p>${p}</p>`).join('')}
    <p>${profile.name}. Based in ${profile.location}. Contact: <a href="mailto:${profile.email}">${profile.email}</a>. Links: <a href="${profile.github}" target="_blank" rel="noopener noreferrer">GitHub</a>, <a href="${profile.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>.</p>
    <h2>Skills</h2>
    ${skills.map((c) => `<h3>${c.group}</h3><ul>${c.items.map((i) => `<li>${i}</li>`).join('')}</ul>`).join('')}
    <h2>Projects</h2>
    ${projects.map((p) => `<h3>${p.title} (${p.stack.join(', ')})${p.status === 'wip' ? ' — in progress' : ''}</h3><ul>${p.points.map((pt) => `<li>${pt}</li>`).join('')}</ul><p>${p.role}</p>`).join('')}
    <h2>Experience</h2>
    <h3>${experience.role}, ${experience.org} (${experience.duration})</h3>
    <ul>${experience.points.map((pt) => `<li>${pt}</li>`).join('')}</ul>
    <h2>Achievement</h2>
    <h3>${achievement.title} — ${achievement.role}</h3>
    <ul>${achievement.points.map((pt) => `<li>${pt}</li>`).join('')}</ul>`;
  document.body.appendChild(aside);
}

export function initPanels({ flat }) {
  const root = el('#panels');
  root.innerHTML = Object.values(templates).map((tpl) => tpl()).join('');
  buildResume();

  // Content-heavy panels scroll internally; the input layer respects this.
  root.querySelectorAll('.panel__inner').forEach((n) => n.setAttribute('data-scrollable', ''));

  const panelEls = ['origin', 'identity', 'skills', 'works', 'path', 'contact']
    .map((name) => root.querySelector(`.panel--${name}`));

  // ---- skills interplay ----------------------------------------------------
  const chips = Array.from(root.querySelectorAll('.chip'));
  const blurb = root.querySelector('#skill-blurb');
  const items = root.querySelector('#skill-items');

  function setCategory(ci, transient = false) {
    chips.forEach((chip, i) => {
      chip.classList.toggle('is-active', i === ci);
      chip.setAttribute('aria-pressed', String(i === ci));
    });
    blurb.textContent = skills[ci].blurb;
    items.innerHTML = skills[ci].items.map((it) => `<li>${it}</li>`).join('');
    if (!transient && !flat) {
      // Nudge the 3D constellation to pulse the same cluster
      window.dispatchEvent(new CustomEvent('skill-ui-select', { detail: ci }));
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => setCategory(Number(chip.dataset.cat)));
  });
  on('skill-hover', (ci) => setCategory(ci, true));
  on('skill-select', (ci) => setCategory(ci));

  // ---- works rows ----------------------------------------------------------
  root.querySelectorAll('.work-row').forEach((row) => {
    row.addEventListener('click', () => emit('open-project', projects[Number(row.dataset.project)]));
  });

  // ---- path cards ------------------------------------------------------------
  root.querySelectorAll('[data-detail]').forEach((btn) => {
    btn.addEventListener('click', () => emit('open-detail', { type: btn.dataset.detail }));
  });

  // ---- contact copy ----------------------------------------------------------
  root.querySelector('#copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      toast(`${profile.email} copied to clipboard`);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  });

  // ---- file downloads -------------------------------------------------------
  function downloadFile(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const slug = profile.name.toLowerCase().replace(/\s+/g, '-');
  root.querySelector('#download-resume').addEventListener('click', () => {
    downloadFile(`${slug}-resume.txt`, resumeText(), 'text/plain;charset=utf-8');
    toast('résumé downloaded');
  });
  root.querySelector('#show-qr').addEventListener('click', () => emit('open-qr'));

  // ---- proximity activation ---------------------------------------------------
  function update(floatValue) {
    if (flat) {
      panelEls.forEach((p) => {
        p.classList.add('is-active');
        p.inert = false;
      });
      return;
    }
    panelEls.forEach((p, i) => {
      // Hero panels (first/last) yield to the scene sooner during travel so the
      // background stays visible while scrolling; content sheets keep a wider window.
      const band = i === 0 || i === panelEls.length - 1 ? 0.34 : 0.42;
      const active = Math.abs(floatValue - i) < band;
      p.classList.toggle('is-active', active);
      p.inert = !active;
    });
  }
  update(state.float);

  return { update };
}
