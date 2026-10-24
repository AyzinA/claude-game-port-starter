---
name: port-autopilot
description: Autonomously drive an approved game port from boot to end credits. Loop over project/PLAYTHROUGH_MAP.md - pick the next unfinished screen/level, research it in the original data, implement it with original assets and UI, prove it with autoplay, update the map - until every node is verified or blocked. Use after /port-game reached GO (or an accepted CONDITIONAL), or when the user asks to keep porting automatically.
argument-hint: "[start | status | stop | <NODE-ID>]"
---

# /port-autopilot

Read `docs/16-BOOT-TO-CREDITS.md`, `docs/17-ORIGINAL-UI.md` and `docs/18-AUTOPILOT.md` first in a fresh session.

## Arguments

- `status`: run `npm run playthrough` and summarize progress, blocked nodes and autopilot state (`project/private/autopilot.json`). Change nothing.
- `stop`: set `"enabled": false` in `project/private/autopilot.json`, write the checkpoint (`docs/11-HANDOFF.md`) and end.
- `start` (default) or a node ID: run the preconditions, then loop. A node ID makes that node the first iteration.

## Preconditions (stop and explain if any fails)

1. `project/FEASIBILITY_REPORT.md` says GO, or CONDITIONAL with the user's acceptance recorded in `project/DECISIONS.md`. Otherwise run `/port-game` instead.
2. `src/games/<game-id>/` exists and is registered in `src/games/index.ts`. If it doesn't, create the adapter skeleton (copy the *structure*, not the content, of `src/games/demo/DemoGame.ts`) with the original virtual resolution, tick rate, default bindings and a `boot` state.
3. `project/PLAYTHROUGH_MAP.md` is built (no template marker). If it isn't, delegate to the `playthrough-cartographer` agent, review its map against the original data, and save it.
4. Enable autopilot: write `project/private/autopilot.json` as `{"enabled": true, "continuations": 0, "maxContinuations": 40, "maxStalls": 3, "startedAt": "<ISO time>"}`. Keep `"commit": true` only if the user has granted commit permission. Remove `project/private/AUTOPILOT_PAUSE` only if the user asked to resume.

## One iteration

1. **Pick:** `npm run playthrough`. Take the reported next node, or the requested one. If its `Depends on` subsystems are missing in `project/COMPATIBILITY_MATRIX.md`, work on the earliest missing dependency first (docs/16 §2 order).
2. **Mark** the node `researching`/`in-progress` in the map.
3. **Evidence:** find the original data for this node: layout and strings for screens, level/script data for gameplay, media for cutscenes. Delegate focused digs: `format-analyst` (formats), `ui-reconstructor` (screens/HUD/fonts), `mechanics-auditor` (gameplay). Record sources in `project/SOURCE_LEDGER.md`.
4. **Implement** in `src/games/<game-id>/`. Generic improvements go in `src/engine`, `src/ui` or `src/render`, with no game imports there. Original resources load through the VFS at runtime; nothing proprietary gets committed.
5. **Prove it:**
   - Extend the adapter's `full` autoplay script so it reaches this node with player inputs only, and add `{ checkpoint: '<NODE-ID>' }`. Use a `segment` script for fast iteration if needed.
   - Run focused tests, then `npm run typecheck` and `npm test` (headless autoplay).
   - For screens and visible nodes: `npm run test:e2e`, then **look at** `test-results/playthrough/<game-id>/<NODE-ID>.png` and at `project/private/reference/<NODE-ID>.png` if it exists. Write down the concrete differences.
   - Use the `autoplay-tester` agent when a run stalls and the cause isn't obvious.
6. **Update:** set the map status (`implemented`, or `verified` only with reference evidence, docs/16 §4), and fill the Verification column with the evidence and date. Update `UI_INVENTORY.md`, `COMPATIBILITY_MATRIX.md` and `STATUS.md` (checkpoint plus next node).
7. **Commit** locally only if `autopilot.json` has `"commit": true`: small commit, no assets, never push.
8. **Continue** with the next iteration immediately. Don't ask the user for confirmation between nodes, and don't end your turn while nodes remain. The Stop hook will send you back with the next node anyway.

## When to mark `blocked` instead of stopping

Mark the node `blocked`, with the exact need and what would unblock it, then move on to an independent node, when it:

- needs something only the user can supply (reference screenshots, a missing disc or DLC file, locally converted media, a decision between tradeoffs);
- hits a docs/10 hard gate (DRM, encrypted content without authorization, online-only services);
- needs a decoder or VM that is larger than one iteration: split it into a subsystem task in COMPATIBILITY_MATRIX and keep working on it across iterations instead.

Batch user requests: collect them in `project/STATUS.md` under "Needs from user" and ask once, when nothing independent is left.

## Finish

When `npm run playthrough` reports every node terminal: run `/verify-playthrough` for the final full run, set autopilot `enabled: false`, and report verified/blocked counts, the blocked list and test results. Never describe blocked or `implemented`-only nodes as done.
