# Game Port Lab — Claude Code starter kit

A **research-first, boot-to-credits** workflow that lets Claude Code port a user-owned Windows, Linux, macOS, Android or iOS game to the browser using **TypeScript + Vite + Three.js**. The port loads the original game data locally, keeps the **original UI** (menus, fonts, HUD, credits) and supports **mod sideloading**.

After a one-time intake and an evidence-based feasibility gate, Claude works **autonomously** through a map of the whole game: boot → logos → title → every menu → every level → cutscenes → ending → end credits. Each node is proved by automated playthrough tests and compared against screenshots of the original.

> **Honest scope:** no tool can turn an arbitrary native executable into a faithful browser game automatically. This kit gives Claude Code the structure, the runtime and the automation to do the port **node by node, with evidence**, and to keep going without hand-holding. Blockers it can't legitimately resolve (DRM, encrypted content, undecodable codecs, missing references) are reported as blocked nodes, never hidden.

## How it works

```text
/port-game ──► public/game auto-detect ─► npm run inventory (engine fingerprint, incl. APK/IPA contents)
           ──► research (docs/19 engine playbooks) ─► FEASIBILITY_REPORT: GO / CONDITIONAL / NO-GO / UNKNOWN
           ──► PLAYTHROUGH_MAP.md (every screen, level, cutscene, ending — from original data)
           ──► src/games/<game-id>/ adapter
/port-autopilot ─► loop: next node → research → implement (original assets + UI) → autoplay proof
                         → screenshots vs originals → update map ─► … until every node verified/blocked
                   (a Stop hook keeps Claude going; budget, stall detection and a pause file keep it safe)
/verify-playthrough ─► full boot-to-credits run headless + in Chromium, screenshot per node
```

## Quick start

1. Install Node.js 22+, then `npm install`. For browser playthrough tests, run `npx playwright install chromium` once.
2. Put your authorized game installation in `public/game/`, optionally with `game.json` (`{"id":"my-game","name":"My Game"}`). Put data mods in `public/mods/`.
3. Run `npm run dev` and open http://127.0.0.1:5317. You'll see the **synthetic demo adapter** running boot → splash → title → menu → options → level → pause → ending → credits. It shows the flow a real port fills with original content. Click the game, then use arrows/WASD, Enter and Esc.
4. Run `claude` in this directory and enter `/port-game`. Claude detects `public/game` (it never asks you to upload it), fingerprints the engine, researches, and writes the feasibility report.
5. After GO, or after you accept a CONDITIONAL verdict, Claude builds the playthrough map and continues with `/port-autopilot`. Check progress anytime with `npm run playthrough` or `/port-autopilot status`. Stop it with `/port-autopilot stop` or by creating `project/private/AUTOPILOT_PAUSE`.
6. To let Claude verify screens, capture reference screenshots of the original game. Save them as `project/private/reference/<NODE-ID>.png` (Git-ignored).

### Starting from an existing repository

Copy `CLAUDE.md`, `.claude/`, `docs/`, `scripts/` and the `src/engine`, `src/ui`, `src/render`, `src/runtime`, `src/host`, `src/games` folders into your repo, then merge carefully with its current instructions. **Don't overwrite existing game code or plans.**

## Docker — run the browser runtime with preloaded game assets and mods

```bash
docker compose up --build -d     # http://localhost:5317
```

`public/game` and `public/mods` are bind-mounted read-only, and are excluded from Git and the image. Docker serves the browser runtime and the loopback-only local resource API. It does **not** run Claude Code. See `docs/15-DOCKER-LOCAL-LIBRARY.md`.

## What's included

| Area | Files |
|---|---|
| Lead-agent contract | `CLAUDE.md` |
| Skills | `/port-game`, `/port-autopilot`, `/verify-playthrough`, `/continue-port`, `/verify-fidelity`, `/check-mod` in `.claude/skills/` |
| Agents | research, formats, feasibility, architecture, **playthrough-cartographer**, **ui-reconstructor**, mechanics, **autoplay-tester**, mods, verification in `.claude/agents/` |
| Autopilot | `.claude/settings.json` (Stop hook + permission allowlist; denies `git push` and edits to `public/game`), `.claude/hooks/autopilot-stop.mjs`, `scripts/lib/autopilot.mjs` |
| Runtime | `src/engine` (fixed clock, action input, game flow, RNG, autoplay), `src/ui` (virtual resolution, widget tree + focus navigation, bitmap fonts), `src/render` (Three.js stage, Canvas UI renderer), `src/runtime`, `src/host` (browser loop + `window.__gamePort` automation bridge), `src/games` (adapter contract, registry, synthetic demo) |
| Tools | `npm run inventory` (read-only engine/format fingerprint), `npm run playthrough` (map progress) |
| Tests | Vitest unit + headless boot-to-credits; Playwright browser playthrough with per-node screenshots; node:test for server and scripts |
| Playbooks | `docs/16` boot-to-credits, `docs/17` original UI, `docs/18` autopilot, `docs/19` engine playbooks (Unity, Unreal, Godot, GameMaker, RPG Maker, Ren'Py, Source, id Tech, Flash, XNA, LÖVE, HTML5, Cocos, Defold, Clickteam, Kirikiri, ZenGin, Gamebryo, Java, DOS, Android/iOS) |
| Templates | `project/` (INTAKE, FEASIBILITY_REPORT, PLAYTHROUGH_MAP, UI_INVENTORY, COMPATIBILITY_MATRIX, STATUS, …); private details go in the ignored `project/private/` |

## Local install / mod policy

- The user's game directory is **read-only**. Never change, repair, decrypt or patch it.
- Original game files are loaded locally. **Never upload, distribute or commit** proprietary assets, reference screenshots or test screenshots (`test-results/` is ignored).
- Mods override virtual paths through a **non-executable data-only overlay**. Locally converted media (e.g. Bink → WebM) can be supplied the same way (docs/19).
- No DRM, licensing, online-auth, anti-cheat or protected-content circumvention is automatically authorized.

## Useful commands

```bash
npm install
npm run dev            # runtime at http://127.0.0.1:5317
npm run typecheck
npm test               # unit + headless boot-to-credits + server + scripts
npm run test:e2e       # Chromium playthrough, screenshots in test-results/playthrough/
npm run inventory      # fingerprint public/game (or: npm run inventory -- --root <dir>)
npm run playthrough    # boot-to-credits progress
npm run build
```

`npm run test:e2e` starts its own dev server on port 5391 (override with `E2E_PORT`), so it never attaches to another instance.

## Claude Code references

- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/hooks

See `docs/00-START.md` for the operating procedure and `docs/16-BOOT-TO-CREDITS.md` for the definition of done.
