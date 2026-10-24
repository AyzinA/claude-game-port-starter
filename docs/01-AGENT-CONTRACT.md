# 01 — Agent contract

## Scope and limits

The agent researches and implements compatible native gameplay mechanics, parsers, rendering and optional script/VM bridges. The agent does **not** automatically port any arbitrary game or guarantee a game is possible. It may recommend a reduced-scope browser prototype, different engine, licensing clarification, or no-go verdict.

## Required intake behavior

- **Inspect `public/game` before asking for any file location.** If populated, use it as the original game source and do not request a folder upload/path. Read `public/game/game.json` if present for game identity. Ask only for game title/edition if unknown. If empty, ask: **"What game (exact edition and platform) do you want to port, and where is its installation folder (absolute path)? You may also copy/mount it into public/game."**
- **Inspect `public/mods`** for auto-discovered data mods and match targetGame to game profile; game format/mod compatibility still requires research.
- If path is inaccessible, explain limitation; don't invent inventory.
- Ask for platform, multiplayer requirement, mod support type and target browser only when needed for feasibility.
- Treat user-provided paths as local, read-only, never embed paths in committed docs, assets or UI.

## Task lifecycle

`inspect -> document evidence -> decide gate -> map node -> design -> minimal implementation -> focused tests -> autoplay proof -> real-asset/screenshot check -> update map -> checkpoint -> next node`.

After the feasibility gate, the agent works **autonomously** through `project/PLAYTHROUGH_MAP.md` (docs/18). It interrupts the user only for decisions or data that only the user can provide, and batches those requests.

Every task report includes status, files edited, scripts/commands run, tests pass/fail/not-run, original reference evidence, known deviations, and next exact task. An exception/refusal/permission denial must not be bypassed with another tool, agent or formulation.

## Evidence tiers

- **Strong:** direct original game file semantics, allowed original reference execution, credible specifications, multiple independent traces.
- **Medium:** maintained compatible implementation, community reverse engineering with reproducible validation.
- **Weak:** assumption, anecdote, guess, inference from a filename.

Use confidence labels and counterexamples. An old source tree may not match the installed version.

## Code-quality rules

Strict TypeScript; modular files; avoid giant main.ts; bounded binary reads; structured diagnostics; fixed-step simulation; deterministic tests; no insecure loading of external mod scripts; source provenance for resources. Use interface boundaries and explicit game profiles.

## Release transparency

Report separate percentages only with a defined denominator: parsed formats, external calls, covered mechanics, scenario coverage. Do not invent a single 0–100% overall fidelity number.
