# Game Port Lab — Claude Code starter kit

A reusable **research-first game-engine reimplementation** workspace for bringing a user-owned PC game to the browser using **TypeScript + Vite + Three.js**, loading original game data locally, with a **mod sideloading** architecture.

> This kit is **not** a universal game converter. No software can reliably turn an arbitrary native executable into a faithful browser game automatically. It gives Claude Code a structured investigation, feasibility gate, implementation roadmap, and a runnable *neutral demo shell*. Game-specific loaders, script execution, native-engine mechanics, and complete gameplay must be implemented after the feasibility study.

## Docker — run the browser shell with preloaded game assets and mods

Put an authorized game installation under `public/game/` and optional data mods under `public/mods/`. These directories are bind-mounted read-only in the container and excluded from source control and Docker images.

```bash
docker compose up --build -d
```

Open **http://localhost:5317**. If `public/game/` contains game files, the UI automatically recognizes the local source and **does not ask for a game folder upload**. Compatible mods in `public/mods/` auto-load as VFS overlays (including after manual game-folder selection when `public/game/` is empty). You can also run `docker compose logs -f` or `docker compose down`.

The Docker app only serves the browser runtime and the loopback-only local resource API; it **does not run Claude Code or automatically port your game**. To perform research and implementation, run Claude Code separately from the project directory. See `docs/15-DOCKER-LOCAL-LIBRARY.md`.

## Quick start

1. Copy or extract this project into an empty directory (preferably outside the original game's installation).
2. Install Node.js 22+ and pnpm (`corepack enable` if appropriate).
3. Run `pnpm install`, then `pnpm dev` to see the neutral Three.js shell.
4. From this directory run `claude` (Claude Code CLI).
5. Enter `/port-game` or say **"Start porting a game"**.
6. The agent **first checks `public/game/`**. If populated, it uses that game directory automatically and does not ask to upload/select files. Otherwise it asks for the game name and path. If metadata is incomplete, it asks only for missing title/edition.
7. Claude researches the game, inspects the installation **read-only**, and writes `project/FEASIBILITY_REPORT.md`. It reports **GO / CONDITIONAL / NO-GO / UNKNOWN**, with evidence and blockers.
8. **Do not treat the demo as the game port**. After a GO decision (or your express acceptance of CONDITIONAL risks), Claude implements each engine milestone and confirms against the real game.

### Starting from an existing repository

Copy `CLAUDE.md`, `.claude/` and `docs/` into your repo and merge carefully with its current instructions. **Do not overwrite existing game code or plans.** You may omit the neutral demo files. Start Claude Code from the repo root.

## Included

- `CLAUDE.md`: lead agent contract and mandatory research/feasibility gates.
- `.claude/skills/port-game/SKILL.md`: interactive `/port-game` intake.
- `.claude/skills/continue-port/SKILL.md`: resume from checkpoint.
- `.claude/skills/verify-fidelity/SKILL.md`: compare engine behavior against original.
- `.claude/skills/check-mod/SKILL.md`: mod compatibility/security audit.
- `.claude/agents/*.md`: specialized research, binary formats, architecture, gameplay, modding, verification agents.
- `docs/`: research, feasibility, architecture, milestone, testing, mod, security and handoff playbooks.
- `project/`: sanitized, versionable findings/roadmap and checkpoint templates; keep exact paths and protected metadata under ignored `project/private/`.
- `src/`: small real Three.js demo, local directory selection and a limited mod ZIP overlay viewer.

## Neutral demo limitations

The demo displays procedural geometry; it **does not decode a specific game's worlds or run its executable**. Files preloaded into `public/game` are indexed automatically but are not yet translated into playable scenes. Local folder selection records file handles only for that browser session. Alternatively, the loopback-only local library service makes preloaded `public/game` and `public/mods` available on demand without a picker. Browsers cannot access an arbitrary Windows path merely because it is written in Claude Code. Mod ZIPs are locally inspected and mounted in a preview VFS, but custom formats and gameplay overrides require a game-specific adapter. The ZIP importer has conservative limits but is not a hardened production archive-processing service.

## Local install / mod policy

- The user's game directory is **read-only**. Never change, repair, decrypt or patch it without an explicit separately requested workflow.
- Original game files are loaded locally by the browser or processed locally by development tools; **do not upload, distribute or commit** proprietary assets.
- Mods override virtual paths through a **non-executable data-only overlay**. Arbitrary JS, native libraries, plugins and scripts are disabled by default; scripted mod support requires a game-specific sandbox plus explicit audit.
- No DRM, licensing, online-auth, anti-cheat, server dependency or protected-content circumvention is automatically authorized.
- Respect individual content licenses, trademarks, copyrights, and any local legal restrictions. Research and compatibility do not confer redistribution rights.

## Useful commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm test
npm run test:server
# Docker alternative: docker compose up --build
```

## Claude Code references

- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/skills

See `docs/00-START.md` for the operating procedure and `docs/03-FEASIBILITY.md` for stop/go gates.
