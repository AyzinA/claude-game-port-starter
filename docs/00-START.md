# 00 — Start here: overall runbook

## Operation

1. User invokes `/port-game` in a newly initialized directory.
2. **Intake:** inspect `public/game` first. If it contains game files, use them without asking for import or path; ask the title/edition only if not identifiable from an optional `game.json` or file evidence. If empty, ask game name/edition and absolute path together. Inspect `public/mods` for preinstalled data mods.
3. **Source access:** prefer the automatic Docker/local `public/game` source. Verify the path exists and is readable; never modify it. Run `npm run inventory` (read-only). It writes file tree statistics, magic-byte formats, package contents (APK/IPA/OBB) and engine candidates to the ignored `project/private/INVENTORY.md`. No source bytes are copied.
4. **External research:** start from the engine's section in `docs/19-ENGINE-PLAYBOOKS.md`. Identify the game engine, UI system/fonts, media codecs, executable dependencies, public format docs, legal constraints, reference implementations, original mod loaders, known preservation tools. Cite URLs with access dates in ledger.
5. **Feasibility:** produce report with verdict and blocker list, honest confidence, a minimum vertical-slice plan and rough effort bands.
6. **GO/CONDITIONAL approval:** after GO, proceed if user has already requested implementation; after CONDITIONAL, obtain acceptance of explicit risks. On NO-GO/UNKNOWN, stop game-specific implementation.
7. **Playthrough map:** build `project/PLAYTHROUGH_MAP.md` (every screen, level, cutscene and ending from boot to credits) from original data, and create the adapter `src/games/<game-id>/` (docs/16).
8. **First original-data result:** `FE-BOOT` runs, a real archive opens, and the first original screen renders with original fonts/textures. A synthetic fallback may remain for tests but must not masquerade as game content.
9. **Autopilot to the credits:** `/port-autopilot` loops node by node (research → implement → autoplay proof → map update) without waiting between nodes, until every node is verified or blocked (docs/18).
10. **Modding:** mount original read-only content at base priority, optional user patches, then mod archives/data overlays with provenance/conflict reports and safe limits.
11. **Compatibility:** build engine behavior subsystem-by-subsystem, maintain scripts/native mechanics split and test against reference behavior.
12. **Progress:** commit verified work if authorized; save checkpoint so another Claude Code session can resume.

## Recommended agent delegation

Research: `game-researcher`; feasibility: `feasibility-reviewer`; formats: `format-analyst`; architecture: `engine-architect`; boot-to-credits map: `playthrough-cartographer`; original UI: `ui-reconstructor`; behavior: `mechanics-auditor`; autoplay: `autoplay-tester`; modding: `mod-reviewer`; verification: `verification-engineer`.

## Absolute priorities

Never confuse a launchable neutral shell with a playable port. Never claim that importing file names means formats decode. Never infer technical feasibility from screenshots. Never conclude full-game equivalence from a few happy-path tests.

## Game-specific output directory

Keep sanitized findings and checkpoints under versionable `project/`. Put machine-specific paths, proprietary material and non-shareable evidence only in Git-ignored `project/private/`. Generic improvements belong in `docs/`/`src/`.
