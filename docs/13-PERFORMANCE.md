# 13 — Browser runtime performance

## Measure before optimizing

Capture environment, JS heap, draw calls, triangles, texture allocations, physics queries, AI/perception time, fixed-tick duration, input latency, GC pauses, resource IO and worker decode time. Compare representative areas, not just the empty demo.

## Design budgets

Target broadly 60fps desktop and an optional 30/60fps mobile quality tier; set actual budgets after the game's world and asset complexity is measured. A slow original engine does not imply its assets are browser-friendly. Models may need GPU-friendly caching; maintain exact logical data when visual LOD varies.

## Runtime strategy

- Fixed simulation clock, bounded catch-up, deterministic RNG in tests.
- Loading workers for expensive original format decode.
- Local caching keyed by original version and active mods.
- Streaming/screen culling of render data while preserving script-critical logical entities.
- Avoid one network request per animation/keyframe; batch local reads.
- Explicit disposal of Three.js GPU resources and audio buffers.

## Test strategy

Small focused tests while implementing, full suite at subsystem milestones, periodic complete playthrough. Track test wall time and simulated game time independently.
