/**
 * Ambient soundscape synthesized with WebAudio — no audio assets.
 * A soft filtered-noise "wind" bed plus tiny interaction blips.
 * Starts muted; the visitor opts in via the HUD toggle.
 */
export function createSoundscape() {
  let ctx = null;
  let master = null;
  let enabled = false;
  let windSource = null;
  let clickBuffer = null;

  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Shared short noise burst used for percussive ticks/clicks.
    const clickLength = Math.floor(ctx.sampleRate * 0.05);
    clickBuffer = ctx.createBuffer(1, clickLength, ctx.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickLength; i++) clickData[i] = Math.random() * 2 - 1;

    // --- wind: looped brown-ish noise through a slow lowpass ---
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    windSource = ctx.createBufferSource();
    windSource.buffer = buffer;
    windSource.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain).connect(filter.frequency);
    const windGain = ctx.createGain();
    windGain.gain.value = 0.5;
    windSource.connect(filter).connect(windGain).connect(master);
    windSource.start();
    lfo.start();

    // --- distant pad: two detuned sines, very quiet ---
    [110, 164.8].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq + i * 0.7;
      const padGain = ctx.createGain();
      padGain.gain.value = 0.05;
      osc.connect(padGain).connect(master);
      osc.start();
    });
  }

  function blip(freq = 720, dur = 0.07, vol = 0.12) {
    if (!enabled || !ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  let tickStep = 0;

  // Mechanical typewriter "tick" — noise click through a fast bandpass.
  function bootTick() {
    if (!ctx) return;
    tickStep = (tickStep + 1) % 3;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = clickBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2400 + tickStep * 320;
    band.Q.value = 2.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime((0.165 + tickStep * 0.0225) * 1.5, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(band).connect(gain).connect(ctx.destination);
    src.start(t, 0, 0.032);
  }

  // Line-return "thunk": low thump with a click, like a carriage advancing.
  function bootLine() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);

    const src = ctx.createBufferSource();
    src.buffer = clickBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 900;
    band.Q.value = 1.4;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.225, t + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(band).connect(g2).connect(ctx.destination);
    src.start(t + 0.02, 0, 0.06);
  }

  // Power-on actuator: a low clunk that leads into the first tick.
  function bootPowerOn() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.09);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.63, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);

    const src = ctx.createBufferSource();
    src.buffer = clickBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 700;
    band.Q.value = 1.1;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.36, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    src.connect(band).connect(g2).connect(ctx.destination);
    src.start(t, 0, 0.05);
  }

  // Boot complete: a soft rising confirm note when the enter prompt appears.
  function bootReady() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [392, 587.3].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.21, t + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.35);
    });
  }

  // Mechanical "load" when entering the workshop / beginning the walk:
  // servo clunk -> rising ratchet -> latch thunk -> confirm chirp.
  function mechLoad() {
    if (!ctx) return;
    const t = ctx.currentTime;

    // 0.00s — low servo clunk
    const clunk = ctx.createOscillator();
    clunk.type = 'sine';
    clunk.frequency.setValueAtTime(90, t);
    clunk.frequency.exponentialRampToValueAtTime(135, t + 0.09);
    const clunkGain = ctx.createGain();
    clunkGain.gain.setValueAtTime(0.45, t);
    clunkGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    clunk.connect(clunkGain).connect(ctx.destination);
    clunk.start(t);
    clunk.stop(t + 0.12);

    // 0.06–0.32s — rising ratchet of bandpass clicks
    for (let i = 0; i < 5; i++) {
      const st = t + 0.06 + i * 0.052;
      const src = ctx.createBufferSource();
      src.buffer = clickBuffer;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 1400 + i * 480;
      band.Q.value = 2.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, st);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.04);
      src.connect(band).connect(g).connect(ctx.destination);
      src.start(st, 0, 0.045);
    }

    // 0.34s — latch thunk
    const thunk = ctx.createOscillator();
    thunk.type = 'sine';
    thunk.frequency.setValueAtTime(130, t + 0.34);
    thunk.frequency.exponentialRampToValueAtTime(68, t + 0.12);
    const thunkGain = ctx.createGain();
    thunkGain.gain.setValueAtTime(0.48, t + 0.34);
    thunkGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.47);
    thunk.connect(thunkGain).connect(ctx.destination);
    thunk.start(t + 0.34);
    thunk.stop(t + 0.49);

    // 0.42s — confirm chirp
    const chirp = ctx.createOscillator();
    chirp.type = 'triangle';
    chirp.frequency.setValueAtTime(520, t + 0.42);
    chirp.frequency.exponentialRampToValueAtTime(880, t + 0.1);
    const chirpGain = ctx.createGain();
    chirpGain.gain.setValueAtTime(0.24, t + 0.42);
    chirpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.53);
    chirp.connect(chirpGain).connect(ctx.destination);
    chirp.start(t + 0.42);
    chirp.stop(t + 0.55);
  }

  return {
    arm() {
      ensureCtx();
      if (ctx.state === 'suspended') ctx.resume();
    },
    toggle() {
      ensureCtx();
      if (ctx.state === 'suspended') ctx.resume();
      enabled = !enabled;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.linearRampToValueAtTime(enabled ? 0.16 : 0, t + 0.8);
      return enabled;
    },
    blipStation: () => blip(540, 0.09, 0.1),
    blipHover: () => blip(880, 0.04, 0.05),
    blipClick: () => blip(320, 0.12, 0.14),
    bootTick,
    bootLine,
    bootPowerOn,
    bootReady,
    mechLoad,
    get enabled() { return enabled; },
  };
}

export function initAudioToggle(soundscape) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sound-toggle';
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', 'Toggle ambient sound');
  btn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z"/><path class="sound-wave" d="M15.5 8.5a5 5 0 0 1 0 7"/>
    </svg>
    <span>sound</span>`;
  btn.addEventListener('click', () => {
    const onNow = soundscape.toggle();
    btn.setAttribute('aria-pressed', String(onNow));
    btn.classList.toggle('is-on', onNow);
  });
  document.querySelector('.hud-top').appendChild(btn);
}
