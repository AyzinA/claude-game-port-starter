# 00 — Start here: overall runbook

## Operation

1. User invokes `/port-game` in a newly initialized directory.
2. **Intake:** inspect `public/game` first. If it contains game files, use them without asking for import or path; ask the title/edition only if not identifiable from an optional `game.json` or file evidence. If empty, ask game name/edition and absolute path together. Inspect `public/mods` for preinstalled data mods.
3. **Source access:** prefer the automatic Docker/local `public/game` source; verify path exists and is readable; never modify it. Read installed file tree, file sizes and recognizable engine/archive/resource metadata. Save redacted inventory, no source bytes.
4. **External research:** identify game engine, executable dependencies, public format docs, legal constraints, reference implementations, original mod loaders, known preservation tools. Cite URLs with access dates in ledger.
5. **Feasibility:** produce report with verdict and blocker list, honest confidence, a minimum vertical-slice plan and rough effort bands.
6. **GO/CONDITIONAL approval:** after GO, proceed if user has already requested implementation; after CONDITIONAL, obtain acceptance of explicit risks. On NO-GO/UNKNOWN, stop game-specific implementation.
7. **First original-data result:** prove a real archive opens, a decoded resource renders and a camera/player moves. Synthetic fallback may remain for tests but must not masquerade as game content.
8. **Modding:** mount original read-only content at base priority, optional user patches, then mod archives/data overlays with provenance/conflict reports and safe limits.
9. **Compatibility:** build engine behavior subsystem-by-subsystem, maintain scripts/native mechanics split and test against reference behavior.
10. **Progress:** commit verified work if authorized; save checkpoint so another Claude Code session can resume.

## Recommended agent delegation

Research: `game-researcher`; feasibility: `feasibility-reviewer`; formats: `format-analyst`; architecture: `engine-architect`; behavior: `mechanics-auditor`; modding: `mod-reviewer`; verification: `verification-engineer`.

## Absolute priorities

Never confuse a launchable neutral shell with a playable port. Never claim that importing file names means formats decode. Never infer technical feasibility from screenshots. Never conclude full-game equivalence from a few happy-path tests.

## Game-specific output directory

Keep sanitized findings and checkpoints under versionable `project/`. Put machine-specific paths, proprietary material and non-shareable evidence only in Git-ignored `project/private/`. Generic improvements belong in `docs/`/`src/`.
