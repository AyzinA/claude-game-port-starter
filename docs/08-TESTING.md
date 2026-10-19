# 08 — Testing and fidelity verification

## Test pyramid

- **Unit:** byte readers, decoders, VFS precedence, path validation, simulation math, VM opcode semantics.
- **Integration:** original archive -> decoded resource -> render; script callback -> ECS command; animation event -> hit; save -> load.
- **Browser E2E:** launcher, local import, first original scene, controls, UI close/reopen, mod enable/disable, offline behavior.
- **Differential:** compare same scenario against allowed original reference run, documenting time, positions, event order and tolerances.
- **Story progression:** per-chapter/quest checkpoints with authentic and accelerated profiles; never substitute test state editing for quest completion.

## Where no original assets are available

Use synthetic fixtures and state clearly that only parser/test logic—not real-game fidelity—was tested. Original game assets must remain uncommitted; local fixture metadata is acceptable.

## Browser performance

Record simulation tick, draw calls, GPU/CPU time, memory, loading, frame drops and mobile constraints. Use standard quality tiers. Fixed tick independent from rendering. Avoid running 20-minute full suites after every small change: focused tests first; full verification at milestone.

## Test artifact report

Always include: exact commands, exit codes, OS, browser/version, installed game edition, tests pass/fail/skip, original references used, visual tests not done and blockers. Do not report a missing tool as a passing test.

## Failure taxonomy

Installation/access, archive parser, asset decoding, script VM, native gameplay, physics, AI, animation, audio/video, renderer, UI/input, mod resolution, save/serialization, test-harness artifact.

## Determinism

Control random seeds, game time and update order in headless tests. Do not change original gameplay semantics just to make a test deterministic. Log input traces for replay.

## Docker and preloaded-library checks

- `npm run test:server` checks directory indexing, read-only on-demand game/mod file reads, byte ranges and path validation.
- `npm run build` must never include original `public/game` or `public/mods` bytes in `dist`.
- `docker compose up --build -d` serves the shell at `http://localhost:5317` if Docker is installed; verify automatic game detection with fixtures and mod priority.
- With empty mounts, verify the UI still offers manual folder import.
- Docker runs the browser app, not the Claude agent or a game native executable.
