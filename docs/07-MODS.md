# 07 — Mod side-loading architecture

**Mod side-loading means loading additional mod packages locally (automatically from `public/mods/` or by manual browser selection), without editing the original game files.** It does not grant universal compatibility with native-code mod loaders.

## Layered read-only virtual filesystem

Priority example (game adapter ultimately decides):

```
Base installed archives (0)
Official permitted patches (100)
User loose overrides (200)
User-selected mods in explicit order (300+)
```

Mounts retain provenance: `source kind`, `source id`, `virtual path`, `priority`, `content fingerprint`, `conflicting overrides`. Resolve case rules per game. Never mutate base files.

## Format and manifest

Use a normalized *internal* manifest; game adapters can ingest native mod formats. See `project/MOD_MANIFEST.md` for sample JSON. Required concepts: mod id, version, target game/profile, requested dependencies, priority/load order, supported file categories, conflicts, optional checksum.

## Safety defaults

- Local packages only; the user explicitly opts in by placing a package under `public/mods` or choosing it in the browser.
- Reject `../`, absolute paths, drive letters, control characters, excessive entry counts/decompressed bytes and duplicate-path conflicts that cannot be resolved predictably.
- Do not execute JS/HTML/native libraries from mods. No remote script URLs.
- If the original game uses native DLL mods, mark unsupported without an audited sandbox/compatibility design.
- Limit memory and compression bombs; use streaming/native archive validation for production. The starter ZIP preview is **not** a hardened production decoder.
- Preserve mod load order in save metadata; warn if active mods differ from those used for a save.

## Compatibility classes

- **Asset override** (textures, models, sounds) — feasible after format support.
- **Data override** (items, worlds, tuning) — depends on game schema.
- **Script mod** — needs an original-compatible VM or safe interpreter.
- **Engine/native plugin** — generally not directly portable; requires clean-room reimplementation of functionality.
- **Network mod** — separate server/protocol feasibility research.

## Acceptance tests

1. Original archives remain unchanged.
2. Override order deterministic.
3. Mod conflicts visible to user.
4. Path traversal rejected.
5. Incompatible game version rejected or warned.
6. Unsupported executable content not run.
7. Mod uninstall restores original resource resolution.
8. Saves detect mod changes.
9. UI works offline.
10. Game-specific native mod format roundtrips where supported.

## Preloaded Docker/local mods

At runtime the starter auto-discovers `public/mods/<mod-id>/mod.json` + `assets/**`, and `public/mods/*.zip` containing root `mod.json` + `assets/**`. Every valid normalized manifest must specify the same `targetGame` ID as `public/game/game.json` (or `local-game` without a game manifest). Higher priority wins. This is a VFS preview only; a native game mod loader must be implemented per game. The starter's ZIP size limit is 30 MiB. Unlike data-only folder mods, ZIPs are decoded in browser memory; keep them small. No mod packages are bundled in the Docker image. See `docs/15-DOCKER-LOCAL-LIBRARY.md`.
