# 02 — Mandatory game research playbook

Before implementation, research the **specific title, release, patch and platform**. Source format and engine architecture often differ even across editions.

## 1. Provenance and access

Identify publisher/developer, game engine and version, release platforms, rereleases, owned installation and whether the user has legitimate local access. Note content license, mod license, redistribution restrictions and any protected content. Do not assert legal conclusions; list jurisdiction-specific uncertainty.

## 2. Read-only local inspection

Collect (metadata, not file copies): file extensions/counts/sizes, directory structure, executable names, engines/middleware signatures, pack/container magic bytes, manifest/version files, scripting assets, save formats, audio, models, animations, textures, world maps, shaders, fonts and mods. Prefer file headers before reverse-engineering arbitrary binaries. Use bounded reads. Never execute an unknown installer or untrusted mod to inspect it.

## 3. Technical research checklist

| Topic | Minimum questions |
|---|---|
| Rendering | Fixed-function, OpenGL, DirectX, Vulkan, custom, 2D/3D, shaders/material semantics? |
| Assets | Mesh, skeleton, animation, texture, terrain, map, UI, fonts, sound, video formats? |
| Containers | Archives, compression, encryption, patch overlays, hash/index lookups? |
| Logic | Scripts? compiled VM? native-only? data-driven quests? events and timers? |
| Physics | Collision, navigation, movement units, fixed time step, platform dependence? |
| Network | Offline? server-authoritative? login? lost services? anti-cheat? |
| Platform | OS APIs, DRM, native plugins, drivers, architecture-specific assumptions? |
| Preservation | Engine clones, parsers, source releases, format specs, reference tests? |
| Modding | Official mods, loose overrides, archive loaders, signed/native code mods? |
| Scale | World size, memory, GPU/CPU demands, browser storage and phone viability? |

## 4. Evidence collection

For every material claim put in `project/SOURCE_LEDGER.md`: URL/path (redacted if local), title, author/publisher, date accessed, exactly what claim it supports, confidence, and how it was verified. Search public technical docs as well as community forums, but weight primary documentation and executable/resource evidence more heavily.

## 5. Feasibility experiments

Plan **small, safe probes**: list an archive, decode one texture, parse one mesh, render one object, inspect script table, check original save format, estimate world memory. Avoid pretending probes establish complete gameplay compatibility. Record what remains unknown.

## 6. No reverse-engineering shortcut assumptions

Decompiled C/C++ output is usually imperfect and not immediately compilable TypeScript. Porting is behavioral reconstruction: distinguish assets/data, scripts/bytecode, and native engine semantics. A legal/technical blocker may make some editions unsuitable even when assets parse.
