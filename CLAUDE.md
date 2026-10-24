# Claude Code lead-agent contract — Game Port Lab

## Mission

Port a specified, user-owned game (Windows, Linux, macOS, Android or iOS) to the browser as a **TypeScript + Vite + Three.js** runtime that plays **from boot to the end credits**: logos, intro, title screen, every menu with the **original UI**, all gameplay, cutscenes, endings and credits. The port reads the original resources locally at runtime and supports safe, non-executable mods.

Work **research-first and autonomously**: one intake question at most, an evidence-based feasibility gate, then an autopilot loop over `project/PLAYTHROUGH_MAP.md` until every node is verified or blocked. Never guarantee 1:1 fidelity, and never claim a node works without autoplay proof plus original evidence.

## First response — mandatory local-library detection, then intake

**Before asking the user to select a game folder, inspect `public/game/` read-only.** It can be a Docker bind mount. If it contains original game files, use that location as the game source automatically. **Do not ask the user to import, upload, select, or provide a local path for files already present there.** Read optional `public/game/game.json` (`id` and `name`), then run `npm run inventory` to fingerprint the engine and formats (read-only; the report goes to Git-ignored `project/private/INVENTORY.md`). If the title or edition still can't be inferred confidently, ask **only for the missing title/edition**. Don't mistake the neutral demo for a game port. Check ownership/authorization before deep analysis.

If `public/game/` is empty, consult `project/INTAKE.md`. Ask for the missing game name and absolute installation path together, or tell the user to mount/copy it into `public/game` (then `npm run inventory -- --root "<path>"` works read-only too). Don't assume a specific game or infer game identity from prior chats. Never claim to have inspected inaccessible data.

Defaults when unspecified (label them as assumptions): scope = **full game, boot to credits, original UI**; target = desktop Chromium, offline single-player. Save sanitized details to `project/INTAKE.md`, and the exact machine path only to Git-ignored `project/private/INSTALLATION.md`.

**Mods:** inspect `public/mods/` before asking users to sideload mods. Accept data-only ZIPs and folder mods with `mod.json`. Preserve load priority, and keep the original installation read-only. Don't execute native code or browser scripts from mods.

**Docker:** `docker compose up --build` serves the browser runtime with bind-mounted `./public/game` and `./public/mods` (read-only). Docker doesn't run the Claude Code agent. See `docs/15-DOCKER-LOCAL-LIBRARY.md`.

## Hard gates

**Gate 0 — source access.** Auto-detect `public/game` first, then ask the user if needed. Read-only access. Never fabricate files or inventory.

**Gate 1 — evidence-based research.** Engine (start from `docs/19-ENGINE-PLAYBOOKS.md`), formats, scripts/bytecode, **UI system and fonts**, animation, physics, audio/video codecs, game loop, platform APIs, networking/DRM, mod formats. Cite sources in `project/SOURCE_LEDGER.md`.

**Gate 2 — feasibility verdict.** `project/FEASIBILITY_REPORT.md`: GO / CONDITIONAL / NO-GO / UNKNOWN for the prototype, the **boot-to-credits** full game, mobile and mods, plus the chosen strategy tier (A original runtime / B script VM / C reimplementation). **No game-specific code before GO, or before the user explicitly accepts a CONDITIONAL verdict (record it in `project/DECISIONS.md`).** On NO-GO/UNKNOWN, stop and state the next probes.

**Gate 3 — playthrough map and first slice.** Build `project/PLAYTHROUGH_MAP.md` from original data (`playthrough-cartographer` agent, `docs/16-BOOT-TO-CREDITS.md`). Create the adapter `src/games/<game-id>/` (implements `src/games/GameAdapter.ts`, registered in `src/games/index.ts`) and make `FE-BOOT` and the first original screen run with original assets.

**Gate 4 — autopilot loop to the credits.** Run `/port-autopilot`. Each iteration takes the next map node, researches the original evidence, implements it, extends the `full` autoplay script (player inputs only), runs headless and browser tests, and updates the map and matrices. Continue without asking between nodes. Mark nodes `blocked` (with the exact need) rather than stopping while independent work remains.

**Gate 5 — complete playthrough.** Every map node terminal; the `full` autoplay reaches the end credits headless and in Chromium (`/verify-playthrough`); screens compared against original references; gaps reported honestly.

## Source handling and security

- Original installation path is **read-only**. Never commit proprietary assets, decompiled proprietary source, original audio/video, original executables, reference screenshots, personal installation paths, credentials, or saves derived from originals. `test-results/` and `project/private/` are Git-ignored for this reason.
- Do not defeat DRM (including App Store FairPlay or encrypted paks/scripts without authorization), bypass anti-cheat, impersonate game servers, or circumvent access controls. Mark such dependencies as blockers.
- Check licenses before using third-party code or runtimes; prefer clean-room implementations based on behaviour and specifications.
- Mod imports are **data-only by default**: no executing untrusted JS/native code, no `eval`, no remote fetches, no path traversal, no unlimited decompression.

## Architecture invariants

- `src/engine`, `src/ui`, `src/render`, `src/runtime`, `src/host`, `src/vfs` **must not import a specific game**. Game code lives only in `src/games/<game-id>/`.
- Every original screen is a `GameState` in `GameFlow`. Overlays (pause, inventory, dialogue) are `overlay` states.
- Original UI is built with `src/ui` from original layout data, fonts and textures (`docs/17-ORIGINAL-UI.md`). There are no invented menus, and missing resources stay visibly missing.
- Fixed simulation ticks, seeded RNG, no wall-clock or rendering dependence in `update()`. Collision independent of visual meshes. Versioned persistence.
- Parsers return engine-neutral typed data; Three.js conversion belongs in render adapters.
- Autoplay scripts only inject inputs and observe state. Scripts never edit game state, and `segment`/warped runs never verify the full flow.
- VFS mounts for original archives, loose files, mods and locally converted media, with provenance and priority.

## Work discipline

1. Read `docs/00-START.md` and the relevant subsystem guidance.
2. Check Git status; never reset user changes.
3. Investigate original behaviour, then implement the smallest slice that moves a map node forward, with tests.
4. Focused tests after edits; `npm test` (includes headless autoplay) at every node; `npm run test:e2e` for visible nodes; full verification at milestones.
5. Keep `project/STATUS.md`, `PLAYTHROUGH_MAP.md`, `UI_INVENTORY.md`, `COMPATIBILITY_MATRIX.md`, `SOURCE_LEDGER.md` and `DECISIONS.md` current and sanitized.
6. Commit small changes only when permission is granted (`project/private/autopilot.json` `"commit": true` counts). **Never push without explicit authorization.**
7. Before a session ends, write the checkpoint and next command (`docs/11-HANDOFF.md`). Don't promise background work after execution stops.

## Skills and agents

- `/port-game`: intake, inventory, research, feasibility, map, then hands off to `/port-autopilot`.
- `/port-autopilot [start|status|stop|NODE]`: the autonomous boot-to-credits loop (the Stop hook keeps it going; `docs/18-AUTOPILOT.md`).
- `/verify-playthrough`: full autoplay headless and in the browser, plus screenshot comparison.
- `/continue-port`: resume from a checkpoint. `/verify-fidelity`: one mechanic in depth. `/check-mod`: mod audit.
- Agents: `game-researcher`, `format-analyst`, `feasibility-reviewer`, `engine-architect`, `playthrough-cartographer`, `ui-reconstructor`, `mechanics-auditor`, `autoplay-tester`, `mod-reviewer`, `verification-engineer`. The lead agent owns integration and gate decisions.

## Required reading

`docs/01-AGENT-CONTRACT.md`, `docs/02-RESEARCH.md`, `docs/03-FEASIBILITY.md`, `docs/04-ARCHITECTURE.md`, `docs/05-ASSET-PIPELINE.md`, `docs/06-SCRIPTS.md`, `docs/07-MODS.md`, `docs/08-TESTING.md`, `docs/09-MILESTONES.md`, `docs/10-LEGAL-SECURITY.md`, `docs/11-HANDOFF.md`, `docs/12-DEFINITION-OF-DONE.md`, `docs/15-DOCKER-LOCAL-LIBRARY.md`, `docs/16-BOOT-TO-CREDITS.md`, `docs/17-ORIGINAL-UI.md`, `docs/18-AUTOPILOT.md`, `docs/19-ENGINE-PLAYBOOKS.md`.
