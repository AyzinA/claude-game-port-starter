---
name: port-game
description: Start a research-first original-game-to-browser port; detect the game in public/game (or ask for name and path once), fingerprint it, study feasibility, then build the boot-to-credits playthrough map and hand off to /port-autopilot for the TypeScript Vite Three.js implementation.
---

# /port-game — Start a new original game port

1. Read `CLAUDE.md`, `docs/00-START.md`, `docs/02-RESEARCH.md`, `docs/03-FEASIBILITY.md`, `docs/16-BOOT-TO-CREDITS.md`, `project/INTAKE.md`.
2. **FIRST inspect `public/game`** for game files that are already mounted (Docker mount or local folder). If there are files, use `public/game` as the game path without asking the user to upload or select them. Check the optional `game.json` for game ID/title. If the title or edition is still unknown after step 3, ask only for that. If the directory is empty, ask one compact question: "What game (exact title/edition/platform) do you want to port, and what is the absolute path to its installed game directory? You can also place/mount it in public/game." Don't choose a title yourself.
3. **Fingerprint:** run `npm run inventory` (or `npm run inventory -- --root "<path>"` for an external path; this is read-only). Read `project/private/INVENTORY.md`: engine candidates, formats, packages (APK/IPA contents included). Open the matching section of `docs/19-ENGINE-PLAYBOOKS.md` and weigh tier A/B/C strategies.
4. Check `public/mods` for data-only ZIP and folder mod packages; discover these automatically before asking for manual mod selection. Record the sanitized title/edition in `project/INTAKE.md`, and the exact source path in the ignored `project/private/INSTALLATION.md`. Never write into the installed game folder.
5. Delegate focused research to `game-researcher`, formats to `format-analyst`, and feasibility critique to `feasibility-reviewer` where useful.
6. Research the game's engine, file formats, VM/scripts/native functionality, **UI system and fonts**, cutscene/audio codecs, networking/DRM, platform APIs, mods, rights and performance. Sources must be verifiable and recorded in `project/SOURCE_LEDGER.md`.
7. Write a substantive `project/FEASIBILITY_REPORT.md` with independent verdicts (prototype / boot-to-credits full game / mobile / mod classes), the chosen strategy tier, blockers, confidence and the first vertical slice. With no source access, the verdict is UNKNOWN, not a fabricated GO.
8. Present the verdict before writing **game-specific** code. A clear GO lets you continue under the user's standing port request. A CONDITIONAL needs explicit acceptance, recorded in `project/DECISIONS.md`. On NO-GO/UNKNOWN, stop implementation and state what data is needed next.
9. Once allowed: create the adapter skeleton `src/games/<game-id>/` and register it in `src/games/index.ts`. Build `project/PLAYTHROUGH_MAP.md` with the `playthrough-cartographer` agent. Then **hand off to `/port-autopilot`**, which loops until every node from boot to the end credits is verified or blocked.
10. Don't redistribute source game assets, don't bypass DRM, and don't execute untrusted mod code.
