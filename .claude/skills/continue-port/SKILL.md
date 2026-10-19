---
name: continue-port
description: Safely resume an interrupted game engine reconstruction from Git status, compatibility reports and persistent checkpoints.
---

# /continue-port

Read `CLAUDE.md`, `project/STATUS.md`, `project/INTAKE.md`, `project/FEASIBILITY_REPORT.md`, `project/COMPATIBILITY_MATRIX.md` and Git status/log. Do not trust old checkpoint values without checking current state. If intake/GO gate not satisfied, run `/port-game` intake/research instead of coding.

If in the middle of a task, preserve uncommitted work and confirm which tests ran. Select the next highest-impact missing original behavior with evidence and prerequisites. Make a bounded plan, implement, run focused tests, update source ledger and compatibility matrix, and continue through `docs/09-MILESTONES.md` while the session permits. Never silently change original installation files or push remote commits.
