# 09 — Development milestones and stop conditions

**No arbitrary promise of full-game parity. Each milestone must be verifiable and produce a runnable browser state where possible.**

| ID | Milestone | Acceptance |
|---|---|---|
| M0 | Intake and feasibility | Correct title/path; `npm run inventory`; source evidence; GO/CONDITIONAL/NO-GO/UNKNOWN; user acceptance if conditional |
| M1 | Neutral runtime shell | `npm run dev` or `docker compose up --build` runs the synthetic demo boot → credits; preloaded game auto-detected; manual import fallback; mod overlay preview; build clean |
| M2 | Original file discovery + map | Real installation recognized, correct edition and source mounts, safe indexing; `PLAYTHROUGH_MAP.md` built from original data; adapter skeleton registered |
| M3 | First original asset | Original texture/mesh/map decoded and rendered with provenance |
| M3-UI | Original front end | Original fonts/UI textures decoded; boot, logos, title and main menu navigable with original layout; `full` autoplay reaches `FE-MAIN-MENU` |
| M4 | World and physics slice | Traversable original level with collision and camera |
| M5 | Character animation | Original model/rig/clips/events, locomotion state tested |
| M6 | Script/logic bridge | Original event/quest/AI logic executes via chosen lawful approach |
| M7 | Gameplay loop | Interaction, NPC AI, combat, inventory, dialogue as applicable |
| M8 | Mod side-loading | Native supported mod format or normalized data package, overlay order, conflict UI, save fingerprint |
| M9 | Save/load and worlds | Persisted state, scene transitions, mod state, no duplicated entities |
| M10 | Representative level/story | Original reference scenarios verified end-to-end |
| M11 | Boot to credits | Every PLAYTHROUGH_MAP node terminal; `full` autoplay reaches END-CREDITS headless and in Chromium; screens compared to references |
| M12 | Broad feature coverage | Measured engine function matrix; branches, alternate endings, all options pages; known divergences and performance |
| M13 | Release candidate | Browser/manual tests, packaging, documented legal/user installation prerequisites |

## Reversible progress

Each milestone ends with tests, dated source notes, a committed change if authorized, and updated `project/STATUS.md`. Do not leap from M1 to a claim of a full playable game.

## Autonomous next task

`npm run playthrough` names the next map node. `/port-autopilot` works through the nodes in dependency order (docs/16 §2) without pausing between them. Within a node, choose the highest-impact **confirmed** missing original behavior whose prerequisites exist. When a genuine unknown blocks a node, mark it `blocked` with the exact need, move to an independent node, and batch user requests.
