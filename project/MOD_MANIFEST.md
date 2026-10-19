# Internal mod manifest example

This is an **internal normalized format for the starter**, not a claim that the target game recognizes it. A future game adapter maps original mod formats into this model.

```json
{
  "id": "example-texture-pack",
  "name": "Example Texture Pack",
  "version": "1.0.0",
  "targetGame": "replace-with-game-id",
  "description": "Locally side-loaded resource replacements",
  "dependencies": [],
  "conflicts": [],
  "priority": 300
}
```

ZIP layout:

```
mod.json
assets/textures/example.png
assets/audio/example.ogg
```

Use the future game's real virtual paths if different. The starter ZIP preview allows an `assets/` prefix for its own virtual filesystem and does not automatically know how original engines resolve resources.
