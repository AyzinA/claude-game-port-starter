# 04 — Reference architecture (adapt after feasibility)

```text
Browser UI (Vite/TypeScript)   Local install directory / permitted local archives
          |                                  |
          +----------------+-----------------+
                           v
            Source importer / virtual filesystem
             | read-only originals, mounted mods
             v
               Parsers / decoded typed data
         (archive, mesh, materials, rigs, scripts)
             |                       |
             v                       v
     Game compatibility          Resource manager
       plugin/adapter                |
             |                       |
             v                       |
        Generic ECS runtime <--------+
     AI, movement, combat, physics, quests,
        dialogue, triggers, persistence
             |
             v
        Renderer-neutral scene state
             |
             v
       Three.js render bridge / WebAudio
```

## Modules

- `src/vfs/`: mount model and virtual resource resolution. **Implemented.**
- `src/import/`: browser local game import and preloaded library. **Indexes files only.**
- `src/engine/`: **Implemented core:**
  - `FixedClock`: fixed ticks with bounded catch-up.
  - `Input`: action bindings for keyboard/gamepad/pointer, plus injection.
  - `GameFlow`: state stack (boot → menus → gameplay → overlays → credits) with transition history.
  - `Rng`: seeded.
  - `Automation`: autoplay scripts.

  Future: ECS, physics, AI, scripting VMs.
- `src/ui/`: **Implemented:** `Viewport` (original virtual resolution with letterbox/integer/stretch), `UiScreen` (widget tree, focus navigation, hit-testing, draw lists) and `Fonts` (bitmap font layout).
- `src/render/`: **Implemented:** `ThreeStage` (WebGL world plus a UI canvas fitted to the virtual resolution) and `CanvasUiRenderer`. Future: original-format mesh/material/animation adapters.
- `src/runtime/GameRuntime.ts`: composes one adapter with the engine. Runs headless (tests/autoplay) or under the host.
- `src/host/BrowserHost.ts`: real-time loop, DOM/gamepad input, fullscreen, and the `window.__gamePort` automation bridge (`?automation=1`).
- `src/games/GameAdapter.ts` + `src/games/index.ts`: game module contract and registry. `src/games/demo/` is the synthetic reference adapter; real games go in `src/games/<game-id>/`.
- `src/formats/<format>/`: bounded parser outputs, no Three.js object allocation (future, per game).
- `src/mods/`: data-only mod manifests, trusted precedence, compatibility verification. **Limited.**

## Contracts

A game module implements `GameAdapter`:

- source detector (`detect`);
- original virtual resolution and fit, and tick rate;
- default bindings;
- UI asset loading (`loadUiAssets`);
- every screen as a `GameState` (`createStates`);
- `autoplay` scripts, including one `full` boot-to-credits run.

It also owns mount rules, decoded resource adapters, the script engine strategy, save format and mod support. The generic engine must not import from any game module. No monolithic game file or ad hoc global state.

## Timing

Use fixed simulation ticks; interpolate render poses. Script events/animation tags run on deterministic simulation time, not inconsistent frames. Browser tab background policies must be handled.

## Save state

Versioned persistence with stable entity identifiers, script states, world deltas, mounted content fingerprint, mod load order, player, NPCs, resources and game time. Do not silently load saves with incompatible mods.

## Architecture decisions

Document uncertainties and decisions in `project/DECISIONS.md`; always distinguish original semantics from modern enhancements.
