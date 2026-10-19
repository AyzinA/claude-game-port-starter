# 05 — Original asset and world import

## Import boundary

The agent CLI may inspect the user-provided absolute local installation **read-only**. The browser **cannot** read an arbitrary CLI path directly. **First check `public/game`**: if populated, the local library endpoint enumerates allowed files and delivers their bytes on demand without a folder picker. This works under both Vite development and Docker production. `vite.config.mjs` sets `publicDir: false` so the originals are not copied to `dist/`. On an empty `public/game`, retain the browser file input fallback. Never expose host file paths or make the original game accessible on a public network. See `docs/15-DOCKER-LOCAL-LIBRARY.md`.

## Pipeline

`Detect edition -> discover original mounts -> index archives -> normalize virtual paths -> bounded decode -> engine-neutral resources -> render adapter -> streamed runtime world`.

## Formats to discover per game

- archives (custom, ZIP, PAK, VDF, WAD, etc.)
- geometry, materials, textures/UV/alpha
- skeletal/vertex/morph animation
- terrain/world scene graph, interactive objects, triggers
- scripts/bytecode/configuration
- fonts/UI maps, languages, voice, audio/music/video
- saves and mod containers

Never assume a file extension has the same binary structure in all games. Verify format magic and version.

## Decoder acceptance criteria

- bounded offsets/counts; endian and alignment explicit
- untrusted malformed inputs rejected with useful errors
- fixture and real-source metadata tests
- no parser dependency on Three.js
- resource ownership / texture and GPU disposal
- geometry positions, winding, normals, transforms, animation event timing validated
- no asset redistribution in tests or commits

## First original-data milestone

1. Identify a source archive.
2. List it with stable paths.
3. Decode one texture and one mesh or map tile.
4. Render with correct transforms and UVs.
5. Put a controllable viewer/camera in the scene.
6. Add a source provenance inspector.
7. Document failures rather than converting assets blindly.

## Browser storage

Read local files with permission; optionally cache decoded content in IndexedDB/OPFS if available. Cache keys incorporate source fingerprints and mod set, but avoid full hashing huge installations every launch.
