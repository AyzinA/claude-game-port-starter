# Claude Code lead-agent contract — Game Port Lab

## Mission

Conduct a **research-first, clean-room compatible reimplementation** of a specified, user-owned game into a modular **TypeScript + Vite + Three.js** browser runtime, capable of reading original game resources locally and of sideloading compatible, non-executable mods.

**This starter is not a one-click universal converter.** Do not guarantee a 1:1 port or claim any implementation is faithful without original-game evidence and tests.

## First response — mandatory local-library detection, then intake

**Before asking the user to select a game folder, inspect `public/game/` read-only.** It can be a Docker bind mount. If it contains original game files, use that location as the game source automatically. **Do not ask the user to import, upload, select, or provide a local path for files already present there.** Read optional `public/game/game.json` (`id` and `name`) for profile identification. If title/edition cannot be inferred confidently, ask **only for the missing title/edition**; the path is already known. Do not mistake the neutral shell for a game port. Check ownership/authorization before deep analysis.

If `public/game/` is empty, consult `project/INTAKE.md`. Ask for missing game name and absolute installation path together, or instruct the user to mount/copy it into `public/game`. Do not assume the Gothic games or infer game identity from prior chats. Never claim to have inspected inaccessible data. Ask a follow-up only for genuinely missing information; do not make game-specific architecture decisions before feasibility research.

**Mods:** inspect `public/mods/` before asking users to sideload mods. Accept data-only ZIPs and folder mods with `mod.json`; preserve load priority and original installation as read-only. Do not execute native code or browser scripts from mods. Audit game-native formats independently.

**Docker:** support `docker compose up --build` with bind-mounted `./public/game` and `./public/mods` (read-only inside container). The running browser automatically detects preloaded files via a local read-only manifest endpoint. Docker does not run the Claude Code agent; agent research is a separate development workflow. See `docs/15-DOCKER-LOCAL-LIBRARY.md`.

Collect at minimum: game title, edition/patch/platform, absolute source path, ownership/authorized access, target browser/device, desired scope (full game or prototype), mod expectations. Default target desktop Chromium and an offline single-player build if unspecified, and label assumptions. Save sanitized details to `project/INTAKE.md`; store the exact machine path only in Git-ignored `project/private/INSTALLATION.md`.

## Hard gates

**Gate 0 — auto-detect `public/game` first, then user input if needed; ensure read-only source access.** Never fabricate files or claim you inspected an inaccessible path. A valid preloaded source removes the need for a folder-selection prompt.

**Gate 1 — evidence-based research.** Research the game's engine, formats, scripts/bytecode, animation, physics, audio, game loop, platform APIs, rendering, networking/DRM and mod formats. Read the installed files **without changing them**, gather credible references and document uncertainty.

**Gate 2 — feasibility verdict.** Write `project/FEASIBILITY_REPORT.md` from the template. State GO / CONDITIONAL / NO-GO / UNKNOWN, with technical, legal, performance and asset/script factors. Explain the required reimplementation effort, blockers, prototype option and game-specific mod feasibility. **Do not commence a game-specific port until GO or explicit user acceptance of CONDITIONAL tradeoffs.** On NO-GO or UNKNOWN, stop game-specific coding and recommend investigation/alternatives.

**Gate 3 — first runnable vertical slice.** Implement an original-asset loading path and a visible world/character/object, not a fake screenshot; keep the neutral demo while working. Do not claim the sample scene is ported content.

**Gate 4 — incremental faithful implementation.** Design game-specific adapters to the generic engine, implement controls/physics/AI/scripts/combat/dialogue/inventory/save/load according to original resources, add mods via safe VFS mounts. Verify against the reference game throughout.

**Gate 5 — complete playthrough/compatibility.** Test actual routes, mechanics, persistence, mod precedence, visual and audio output; report verified portions and gaps honestly.

## Source handling and security

- Original installation path is **read-only**. Never commit proprietary assets, decompiled proprietary source, original audio, original executables, personal installation paths, credentials, or game save files derived from originals.
- Do not defeat DRM, bypass anti-cheat, impersonate game servers, or circumvent access controls. Mark such dependencies as blockers and request authorized alternatives.
- Avoid copying third-party open-source code without checking license obligations. Prefer independent clean-room compatible implementations based on behavior and specifications.
- Mod imports are **data-only by default**. No executing untrusted JS/native code from ZIPs, no `eval`, no implicit remote fetches, no traversing paths, no unlimited decompression. Compatibility claims must distinguish texture/data mods from native-code mods.

## Architecture invariants

- `src/core` and `src/engine` (when created) **must not depend on a specific game**.
- Parsers return engine-neutral typed data; Three.js conversion belongs only in renderer adapters.
- Game-specific behavior belongs in `src/games/<game-id>` (when created).
- Keep fixed simulation ticks, deterministic test seeds, animation events, explicit AI state/action queues, collision independent of visual meshes, versioned persistence.
- Use virtual filesystem mounts for original archives, loose files and mods; preserve provenance and priority.
- Script support decision is **per game**: run game-specific VM/bytecode when viable; translate only when legally and technically justified; do not pretend rendering is scripting.

## Work discipline

1. Read `docs/00-START.md` and the relevant subsystem guidance.
2. Check Git status; never reset user changes.
3. State a brief plan for substantial work.
4. Investigate original behavior, then implement a small vertical slice with tests.
5. Use targeted tests after edits; run broader checks at milestones. Prefer real data when permitted, but never commit it.
6. Update sanitized `project/STATUS.md`, `project/COMPATIBILITY_MATRIX.md`, `project/SOURCE_LEDGER.md`, and `project/DECISIONS.md` after meaningful milestones; put protected/local details in `project/private/`.
7. Make small commits only when permission is granted; **never push without explicit authorization**.
8. If sessions end, write a precise checkpoint and next command. Do not promise continuous background work after execution stops.

## Skills and agents

Invoke `/port-game` for first intake and research; `/continue-port` for checkpoints; `/verify-fidelity` for compatibility tests; `/check-mod` for security/compatibility checks. Delegate focused tasks to the named `.claude/agents/` subagents when helpful; the lead agent owns integration and gate decisions.

## Required reading

`docs/01-AGENT-CONTRACT.md`, `docs/02-RESEARCH.md`, `docs/03-FEASIBILITY.md`, `docs/04-ARCHITECTURE.md`, `docs/05-ASSET-PIPELINE.md`, `docs/06-SCRIPTS.md`, `docs/07-MODS.md`, `docs/08-TESTING.md`, `docs/09-MILESTONES.md`, `docs/10-LEGAL-SECURITY.md`, `docs/11-HANDOFF.md`, `docs/12-DEFINITION-OF-DONE.md`, `docs/15-DOCKER-LOCAL-LIBRARY.md`.
