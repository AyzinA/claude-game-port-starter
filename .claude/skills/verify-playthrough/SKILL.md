---
name: verify-playthrough
description: Run the port's full boot-to-credits autoplay headless and in Chromium, capture a screenshot per playthrough node, compare against original reference screenshots, and update PLAYTHROUGH_MAP verification. Use to verify progress, before claiming a node or the whole game works, or after regressions.
argument-hint: "[<NODE-ID> | all]"
---

# /verify-playthrough

1. `npm run typecheck` and `npm test`. The headless `full` autoplay must reach the end credits, or the furthest node implemented so far. Record the exact command and exit codes.
2. `npm run test:e2e` (if Chromium is missing: `npx playwright install chromium`). Read `test-results/playthrough/<game-id>/<script>.report.json` for checkpoints, ticks and errors.
3. For each checkpoint (or only the requested node): read the port screenshot `test-results/playthrough/<game-id>/<NODE-ID>.png` and, if present, the original reference `project/private/reference/<NODE-ID>.png`. Compare layout, fonts, textures, text, colours, focus highlight and missing (magenta) resources. Be concrete: "title 4px lower", "wrong font on button labels", "missing background texture".
4. Update `project/PLAYTHROUGH_MAP.md`:
   - Matches with reference evidence: `verified`, with the date and evidence in Verification.
   - No reference: at most `implemented`, and list the node under "Needs from user: reference screenshots" in `project/STATUS.md`.
   - Differences: keep or reset to `in-progress`, and list the differences.
   - The run stops before the node: the status can't be above `implemented`. Record the failing step from the report.
5. Never treat `segment` script results or warped starts as verification of the full flow. Never edit game state to pass a step.
6. Report: nodes reached, verified, regressed and blocked, plus the commands and results.
