---
name: port-game
description: Start a research-first original-game-to-browser port; interview user for game name and installation path, study feasibility, and only then build a TypeScript Vite Three.js engine.
---

# /port-game — Start a new original game port

1. Read `CLAUDE.md`, `docs/00-START.md`, `docs/02-RESEARCH.md`, `docs/03-FEASIBILITY.md`, `project/INTAKE.md`.
2. **FIRST inspect `public/game`** for already mounted game files (Docker mount or local folder). If there are files, use `public/game` as the game path without asking the user to upload/select them. Check optional `game.json` for game ID/title. If title or edition remains unknown, ask only for that missing information. If the directory is empty, ask one compact question: "What game (exact title/edition/platform) do you want to port, and what is the absolute path to its installed game directory? You can also place/mount it in public/game." Do not choose a title yourself.
3. Check `public/mods` for data-only ZIP and folder mod packages; automatically discover these before requesting manual mod selection. Record sanitized title/edition in `project/INTAKE.md`, and exact source path in ignored `project/private/INSTALLATION.md`. Check existence, readability, expected files and permission before inspection. Never write into the installed game folder.
4. Delegate focused research to `game-researcher`, formats to `format-analyst`, feasibility critique to `feasibility-reviewer` where useful.
5. Research game engine, file formats, VM/scripts/native functionality, original assets, multimedia, networking/DRM, platform APIs, mods, rights/performance. Sources must be verifiable and in `project/SOURCE_LEDGER.md`.
6. Write a substantive `project/FEASIBILITY_REPORT.md` with independent verdicts (prototype/full/mobile/mod classes), blockers, confidence and bounded vertical slice. If there is no source access, use UNKNOWN, not a fabricated GO.
7. Present verdict to user before starting **game-specific** code. A clear GO allows continuation under the user's standing port request; a CONDITIONAL needs explicit acceptance. On NO-GO/UNKNOWN stop implementation and state next data needed.
8. Once allowed, continue M2-M12 in `docs/09-MILESTONES.md` and update checkpoint after each milestone. Keep neutral Vite demo separate from original content.
9. No redistributing source game assets, no DRM bypass, no executing untrusted mod code.
