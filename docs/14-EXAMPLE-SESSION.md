# 14 — Example Claude Code intake transcript

**User:** `/port-game`

**Agent:** "Which game (exact title/edition/platform) do you want to port, and what is the absolute path to its installed game files?"

**User:** "Example Game, Windows release 1.2, `D:\\Games\\Example Game`. I own this copy. Desktop browser first; I want data mods to load locally."

**Agent:** "I'll inspect that folder read-only, research the engine and available format documentation, and write an evidence-based feasibility report before implementing game-specific code. I will not change your installation."

**Agent after research:** "Prototype: GO if the texture/world parsers pass the proposed probes. Full single-player: CONDITIONAL because the game's script runtime is not documented. Native DLL mods: unsupported. Evidence and exact blockers are in `project/FEASIBILITY_REPORT.md`. Do you accept a prototype-first port that initially supports only asset/data mods?"

**Note:** The example verdict is fictional. It is a sample interaction pattern, not an assessment of any real game.

## Preloaded game and mods (no folder-selection prompt)

**Setup:** Copy the authorized game files into `public/game/`, add optional `game.json`, and add valid data mod packages under `public/mods/`. Then run `docker compose up --build` to start the local game shell.

**User in Claude Code:** `/port-game`

**Agent:** "I found an existing game installation under `public/game` and will use it read-only. I will check its exact edition, research the engine and format compatibility, then report feasibility. I also found the local mod folder. No game upload is needed."

If `game.json` is missing and the original game's edition cannot be identified reliably, the agent asks only for the missing edition/title, **not** for a path or upload. Docker is for running the browser shell, not the Claude Code agent.
