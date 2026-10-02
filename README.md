# Shraddha Subedi — Interactive Portfolio

An experimental, WebGL-driven portfolio built as a navigable 3D experience rather than
a scrolling page. You travel a dusk-lit valley of six **stations** — Origin, Identity,
Skills, Works, Path and Contact — while project artifacts, a skill constellation and a
contact beacon react to your pointer.

Built with **Vite + Three.js** (no other runtime dependencies).

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # serve the production build
```

## Experience map

| Station | What lives there |
| --- | --- |
| 00 Origin | Hero identity + the workshop monolith |
| 01 Identity | Background, degree, focus areas |
| 02 Skills | Interactive skill constellation grouped by category |
| 03 Works | Three clickable project artifacts (quiz terminal, DB schema artboard, responsive sites) |
| 04 Path | Internship workstation + OSM Hackfest 2023 flag monument |
| 05 Transmit | Contact beacon — click it to copy the email |

## Controls

- **Scroll / swipe up-down** — travel along the valley path
- **↑ ↓ / PageUp / PageDown / 0–5 / Home / End** — keyboard travel
- **Click objects** — open details, copy email
- **Rail on the left (bottom dock on mobile)** — direct station navigation

## Accessibility & performance notes

- All content exists as real HTML: panels per station plus a screen-reader résumé (`#resume`).
- `prefers-reduced-motion` disables the boot typing, camera easing, drift and pulses.
- Without WebGL the site falls back to a flat, fully readable layout.
- Particle counts, pillar density and pixel ratio scale down for mobile/low-power devices,
  with an FPS watchdog that degrades quality automatically.
