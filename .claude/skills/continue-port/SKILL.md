---
name: continue-port
description: Safely resume an interrupted game port from Git status, the playthrough map, compatibility reports and persistent checkpoints, then continue the boot-to-credits loop.
---

# /continue-port

Read `CLAUDE.md`, `project/STATUS.md`, `project/INTAKE.md`, `project/FEASIBILITY_REPORT.md`, `project/COMPATIBILITY_MATRIX.md`, Git status/log, and run `npm run playthrough`. Don't trust old checkpoint values without checking the current state. If the intake/GO gate isn't satisfied, run `/port-game` intake and research instead of coding.

If you're in the middle of a task, preserve uncommitted work and confirm which tests ran. Re-run only the tests relevant to changed files (`npm test` covers the headless autoplay).

Then:

- If `project/private/autopilot.json` has `"enabled": true`, or the user wants unattended progress: continue with `/port-autopilot`.
- Otherwise: pick the next node reported by `npm run playthrough`, make a bounded plan, implement it, prove it with autoplay (docs/16 §3), update the map, ledger and matrices, and stop with a checkpoint.

Never silently change original installation files or push remote commits.
