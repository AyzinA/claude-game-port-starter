# Local mod packages

Place either:
- `public/mods/<mod-id>/mod.json` and `public/mods/<mod-id>/assets/...` (folder mod), or
- `public/mods/<mod-name>.zip` containing root `mod.json` and `assets/...`.

Example `mod.json`:
```json
{ "id": "sky-pack", "name": "Sky Pack", "version": "1.0", "targetGame": "my-game", "priority": 300 }
```

Compatible data mods auto-load as VFS overlays when the browser starts. Native executable mods aren't run. Only data import/preview is provided until a game-specific mod adapter exists.
