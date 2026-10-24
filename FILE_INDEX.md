# File index

| File | Purpose |
|---|---|
| `CLAUDE.md` | Lead-agent contract: mission, gates, invariants |
| `README.md` | Overview and quick start |
| `.claude/settings.json` | Autopilot Stop hook, permission allowlist, deny `git push` and edits to `public/game` |
| `.claude/hooks/autopilot-stop.mjs` | Keeps the agent working while the playthrough map is incomplete (opt-in) |
| `.claude/skills/port-game/SKILL.md` | `/port-game`: intake, inventory, research, feasibility, map, handoff |
| `.claude/skills/port-autopilot/SKILL.md` | `/port-autopilot`: autonomous boot-to-credits loop |
| `.claude/skills/verify-playthrough/SKILL.md` | `/verify-playthrough`: full autoplay + screenshot comparison |
| `.claude/skills/continue-port/SKILL.md` | `/continue-port`: resume from checkpoint |
| `.claude/skills/verify-fidelity/SKILL.md` | `/verify-fidelity`: one mechanic in depth |
| `.claude/skills/check-mod/SKILL.md` | `/check-mod`: mod audit |
| `.claude/agents/game-researcher.md` | Engine/format/mod research |
| `.claude/agents/format-analyst.md` | Binary format parsers |
| `.claude/agents/feasibility-reviewer.md` | Independent verdicts |
| `.claude/agents/engine-architect.md` | Architecture review |
| `.claude/agents/playthrough-cartographer.md` | Builds PLAYTHROUGH_MAP from original data |
| `.claude/agents/ui-reconstructor.md` | Original menus/HUD/fonts |
| `.claude/agents/mechanics-auditor.md` | Gameplay mechanics fidelity |
| `.claude/agents/autoplay-tester.md` | Autoplay scripts and stalled runs |
| `.claude/agents/mod-reviewer.md` | Mod security/compatibility |
| `.claude/agents/verification-engineer.md` | Test design and claim review |
| `docs/00-START.md` … `docs/15-DOCKER-LOCAL-LIBRARY.md` | Runbook and subsystem guidance |
| `docs/16-BOOT-TO-CREDITS.md` | Playthrough map, autoplay, verification: the definition of a complete port |
| `docs/17-ORIGINAL-UI.md` | Original UI reconstruction |
| `docs/18-AUTOPILOT.md` | Unattended loop, safety rails |
| `docs/19-ENGINE-PLAYBOOKS.md` | Per-engine strategies, formats, media |
| `project/*.md` | Sanitized templates: INTAKE, FEASIBILITY_REPORT, PLAYTHROUGH_MAP, UI_INVENTORY, COMPATIBILITY_MATRIX, TEST_MATRIX, SOURCE_LEDGER, DECISIONS, MOD_MANIFEST, STATUS |
| `src/engine/` | FixedClock, Input, GameFlow, Rng, Automation (game-neutral) |
| `src/ui/` | Viewport, UiScreen, Fonts (game-neutral) |
| `src/render/` | ThreeStage, CanvasUiRenderer |
| `src/runtime/GameRuntime.ts` | Adapter + engine composition, headless or hosted |
| `src/host/BrowserHost.ts` | Browser loop, input, `window.__gamePort` bridge |
| `src/games/` | `GameAdapter` contract, registry, synthetic `demo/` adapter |
| `src/vfs/`, `src/import/`, `src/mods/` | Overlay VFS, local import/preloaded library, data-only mods |
| `server/` | Loopback-only local library API + production server |
| `scripts/inventory.mjs`, `scripts/lib/fingerprint.mjs` | Read-only installation fingerprint |
| `scripts/playthrough-status.mjs`, `scripts/lib/playthrough.mjs` | Map parser and progress |
| `scripts/lib/autopilot.mjs` | Autopilot decision logic |
| `tests/*.test.ts`, `tests/e2e/`, `server/*.test.mjs`, `scripts/*.test.mjs` | Unit, headless playthrough, browser playthrough, server, scripts |
