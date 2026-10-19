# 09 — Development milestones and stop conditions

**No arbitrary promise of full-game parity. Each milestone must be verifiable and produce a runnable browser state where possible.**

| ID | Milestone | Acceptance |
|---|---|---|
| M0 | Intake and feasibility | Correct title/path; source evidence; GO/CONDITIONAL/NO-GO/UNKNOWN; user acceptance if conditional |
| M1 | Neutral Three.js shell | `pnpm dev` or `docker compose up --build` runs demo; preloaded game auto-detected; manual import fallback; mod overlay preview; build clean |
| M2 | Original file discovery | Real installation recognized, correct edition and source mounts, safe indexing |
| M3 | First original asset | Original texture/mesh/map decoded and rendered with provenance |
| M4 | World and physics slice | Traversable original level with collision and camera |
| M5 | Character animation | Original model/rig/clips/events, locomotion state tested |
| M6 | Script/logic bridge | Original event/quest/AI logic executes via chosen lawful approach |
| M7 | Gameplay loop | Interaction, NPC AI, combat, inventory, dialogue as applicable |
| M8 | Mod side-loading | Native supported mod format or normalized data package, overlay order, conflict UI, save fingerprint |
| M9 | Save/load and worlds | Persisted state, scene transitions, mod state, no duplicated entities |
| M10 | Representative level/story | Original reference scenarios verified end-to-end |
| M11 | Broad feature coverage | Measured engine function matrix; known divergences and performance |
| M12 | Release candidate | Browser/manual tests, packaging, documented legal/user installation prerequisites |

## Reversible progress

Each milestone ends with tests, dated source notes, a committed change if authorized, and updated `project/STATUS.md`. Do not leap from M1 to a claim of a full playable game.

## Autonomous next task

Choose the highest-impact **confirmed** missing original mechanic whose prerequisites exist. Avoid time-consuming automated game-playing tactics unless needed for verification. When blocked by a genuine unknown, move to an independent milestone and document the dependency.
