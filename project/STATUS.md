# Agent status / resume checkpoint

Game: NOT SELECTED
Gate: INTAKE REQUIRED
Playthrough map: template (not built) · `npm run playthrough`
Autopilot: off (`project/private/autopilot.json` absent)
Last known working feature: game-neutral runtime (fixed-tick flow, original-UI layer, autoplay) running the synthetic demo adapter boot → credits, headless and in Chromium
Next exact action: launch Claude Code and run `/port-game` (it inspects `public/game` first)
Tests: run `npm install`, `npm run typecheck`, `npm test`, `npm run test:e2e` (needs `npx playwright install chromium` once), `npm run build`
Important: This starter has not decoded any specific game's assets. The demo adapter is synthetic.
