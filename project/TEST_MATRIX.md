# Test matrix

| Test | Synthetic / original | Expected | Status | Evidence |
|---|---|---|---|---|
| Engine: clock, input, flow, RNG | synthetic | deterministic ticks/transitions | not run | `npm test` (tests/engine.test.ts) |
| UI: viewport, focus nav, bitmap fonts | synthetic | layout/focus/wrap correct | not run | `npm test` (tests/ui.test.ts) |
| Demo boot-to-credits headless | synthetic | `full` autoplay reaches credits, deterministic | not run | `npm test` (tests/playthrough.test.ts) |
| Demo boot-to-credits in browser | synthetic | checkpoints captured, no page errors | not run | `npm run test:e2e` |
| VFS override precedence | synthetic | high-priority wins | not run | `npm test` |
| Unsafe ZIP virtual path | synthetic | rejected/skipped | not run | `npm test` |
| Inventory / playthrough / autopilot scripts | synthetic | fingerprints, parsing, hook decisions | not run | `npm test` (scripts/scripts.test.mjs) |
| Original game boots to main menu | original | FE nodes reached by `full` autoplay | blocked | game unselected |
| Original game boot-to-credits | original | `full` autoplay reaches END-CREDITS | blocked | game unselected |
| Original screens match references | original | screenshot comparison per node | blocked | game unselected |
| Quest script executes | original | correct state transition | blocked | game unselected |
| Mod native format works | original mod | resource override | blocked | format unknown |
