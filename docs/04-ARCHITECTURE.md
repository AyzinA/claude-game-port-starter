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

- `src/core/`: byte readers, unit conversions, IDs, diagnostics, fixed clock.
- `src/vfs/`: mount model and virtual resource resolution. **Starter implemented.**
- `src/import/`: browser local game import. **Starter indexes files only.**
- `src/formats/<format>/`: bounded parser outputs, no Three.js object allocation.
- `src/engine/`: engine-neutral simulation, ECS, commands/events, time, physics, AI (future).
- `src/games/<game-id>/`: version profiles, script bindings, game-native semantics (future).
- `src/render/`: Three.js conversion and lifecycle (future).
- `src/mods/`: data-only mod manifests, trusted precedence, compatibility verification. **Starter limited.**
- `src/ui/`: game launcher, controls, import, menus, accessibility (future).

## Contracts

Game module defines source detector, mount rules, decoded resource adapters, script engine strategy, gameplay compatibility, starting world, save format and mod support. Generic engine must not import from any game module. No monolithic game file or ad hoc global state.

## Timing

Use fixed simulation ticks; interpolate render poses. Script events/animation tags run on deterministic simulation time, not inconsistent frames. Browser tab background policies must be handled.

## Save state

Versioned persistence with stable entity identifiers, script states, world deltas, mounted content fingerprint, mod load order, player, NPCs, resources and game time. Do not silently load saves with incompatible mods.

## Architecture decisions

Document uncertainties and decisions in `project/DECISIONS.md`; always distinguish original semantics from modern enhancements.
