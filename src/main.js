import { startApp } from './core/app.js';

// Tells the inline failsafe in index.html that module code is allowed to run
// (it stays false when scripts are blocked, e.g. over file://).
window.__PORTFOLIO_BOOTED__ = true;

startApp().catch((err) => {
  console.error('Failed to start the portfolio:', err);
  document.body.classList.add('flat');
  const boot = document.querySelector('#boot');
  if (boot) boot.remove();

  // Never leave a silent black page behind — render the failure.
  const panels = document.querySelector('#panels');
  if (panels && !panels.childElementCount) {
    panels.innerHTML = `
      <section class="panel" style="opacity:1;visibility:visible;position:static;margin:120px auto;width:min(700px,92vw)">
        <div class="panel__inner">
          <header class="panel__head"><h2>Startup failed</h2><span class="panel__index mono">ERR</span></header>
          <p class="body-copy">${String(err?.message ?? err)}</p>
          <p class="body-copy mono">Try a hard refresh (Ctrl+Shift+R). If it keeps happening, open DevTools (F12) and check the console.</p>
        </div>
      </section>`;
  }
});
