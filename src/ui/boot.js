import { state, emit, on } from '../core/state.js';
import { el } from '../utils/dom.js';

const LINES = [
  'SHRADDHA.SYS — aurora workshop',
  'locating ......... Baneshwor, Kathmandu · NP',
  'education ........ BSc.CSIT · Tribhuvan University · 2023',
  'mounting ......... html css js bootstrap react c# .net sqlserver mysql',
  'artifacts ........ 3 projects · 1 in progress · 1 internship · 1 hackfest',
  'terrain .......... aurora bay · 6 stations · 1 lighthouse',
  'all systems ...... nominal_',
];

const IDLE_LINE = 'awaiting signal .... press any key · or tap to power on';

export function initBoot(soundscape, onStart) {
  const bootEl = el('#boot');
  const log = el('#boot-log');
  const enterBtn = el('#boot-enter');
  let done = false;
  let started = false;
  let typing = false;
  let timers = [];

  function showEnter() {
    if (done) return;
    done = true;
    soundscape.bootReady();
    enterBtn.classList.add('is-visible');
    enterBtn.focus({ preventScroll: true });
  }

  function finishTyping() {
    timers.forEach(clearTimeout);
    timers = [];
    log.innerHTML = LINES.map((l) => `<span class="boot__line">${l}</span>`).join('');
    showEnter();
  }

  function begin() {
    if (typing) return;
    typing = true;
    soundscape.arm();
    soundscape.bootPowerOn();
    log.innerHTML = '';
    typeLines();
    timers.push(setTimeout(finishTyping, 6000)); // hard safety net
  }

  function typeLines() {
    let lineIndex = 0;
    const typeNextLine = () => {
      if (lineIndex >= LINES.length) {
        showEnter();
        return;
      }
      const text = LINES[lineIndex];
      const span = document.createElement('span');
      span.className = 'boot__line';
      log.appendChild(span);
      let charIndex = 0;
      const tick = () => {
        if (done) return;
        charIndex += 2;
        span.textContent = text.slice(0, charIndex);
        soundscape.bootTick();
        if (charIndex < text.length) {
          timers.push(setTimeout(tick, 9));
        } else {
          soundscape.bootLine();
          lineIndex += 1;
          timers.push(setTimeout(typeNextLine, 60));
        }
      };
      tick();
    };
    typeNextLine();
  }

  function start() {
    if (started) return;
    started = true;
    soundscape.arm();
    soundscape.mechLoad();
    bootEl.classList.add('is-leaving');
    setTimeout(() => {
      bootEl.classList.add('is-gone');
      state.entered = true;
      emit('entered');
      onStart?.();
    }, state.reducedMotion ? 80 : 640);
  }

  // Tap 1 powers on the typewriter; taps after skip to the end.
  bootEl.addEventListener('click', (e) => {
    if (!typing && !done) begin();
    else if (!done) finishTyping();
    else if (e.target.closest('#boot-enter')) start();
  });

  window.addEventListener('keydown', (e) => {
    if (state.entered) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (done) start();
      else if (typing) finishTyping();
      else begin();
    } else if (e.key !== 'Tab') {
      if (typing) finishTyping();
      else begin();
    }
  });

  if (state.reducedMotion) {
    finishTyping();
  } else {
    log.innerHTML = `<span class="boot__line boot__line--idle">${IDLE_LINE}</span>`;
  }

  on('entered', () => {
    document.querySelectorAll('.hint').forEach((h) => h.classList.add('is-visible'));
  });
}