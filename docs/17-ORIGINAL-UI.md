# 17 — Original UI reconstruction

Players recognise a game by its menus, fonts, HUD and dialogue boxes as much as by its 3D world. The port reuses the **original UI resources and layout** from the user's installation, loaded at runtime and never committed. It does not invent UI.

## Runtime building blocks (already in `src/`)

| Module | Purpose |
|---|---|
| `src/ui/Viewport.ts` | Original virtual resolution (e.g. 640×480) mapped to the browser with `letterbox`, `integer` (pixel art) or `stretch`, whichever the original did. Pointer coordinates are converted back to virtual pixels. |
| `src/ui/UiScreen.ts` | UI tree (`panel`, `image`, `text`, `button`) in virtual pixels; keyboard/gamepad focus navigation (explicit neighbours or spatial); pointer hit-testing; `navigate()` returns the activated command; `drawList()` produces renderer-neutral commands. |
| `src/ui/Fonts.ts` | Bitmap font model (glyph atlas, advances, offsets, kerning, fallback glyph) and word-wrapping layout, so original fonts render pixel-exact. |
| `src/render/CanvasUiRenderer.ts` | Draws UI command lists on a 2D canvas above the Three.js canvas. Missing original resources show as **magenta boxes** and log a warning; nothing is silently replaced. |
| `src/engine/GameFlow.ts` | Each original screen is a state; pause/inventory/dialogue are `overlay` states drawn above gameplay. |

If the original UI is better served by another approach (e.g. a Scaleform/Flash UI run through a compatible SWF player, or a 3D in-world menu), record the decision in `project/DECISIONS.md` and keep the same `GameState` and autoplay contract.

## Procedure per screen

1. **Identify the UI system** from evidence: engine UI (Unity uGUI prefabs, Unreal UMG widgets, Godot scenes), Scaleform/Flash (`.gfx`/`.swf`), CEGUI/custom XML layouts, script-driven menus (positions hard-coded in scripts or executable data), or video-backed menus.
2. **Extract the layout data**: positions, sizes, anchors, z-order, which texture/atlas region each element uses, font per text element, string IDs, focus order, sounds on focus/confirm/back, transitions (fades, slides) and their durations.
3. **Decode resources** with a bounded parser into `UiAssets`: images as `ImageBitmap`/canvas, and fonts as `BitmapFontData`. Pre-tint bitmap fonts when the original used per-colour glyphs.
4. **Build the `UiScreen`** in the adapter (`src/games/<id>/ui/`). Positions come from the data, not from eyeballing. When a value is hard-coded in the executable and you can only measure it from screenshots, mark it `inferred` in UI_INVENTORY.
5. **Wire behaviour** in the state's `update()`: commands, back behaviour, wrap-around, disabled entries, option values persisted to the port's settings store, confirmation dialogs.
6. **Localization**: use the original string tables. Language selection follows the original's options or config.
7. **Audio**: UI sounds and menu music from original files via WebAudio, triggered on the same events.
8. **Verify** against `project/private/reference/<NODE>.png` (docs/16 §4) and record the result in `project/UI_INVENTORY.md`.

## Rules

- No CSS/system fonts for original text, except as a temporary fallback that is listed as a deviation.
- Keep the original aspect ratio and safe areas. Widescreen support is an *enhancement*: it must be optional and labeled.
- HUD elements read simulation state; they never drive it.
- Input prompts (key icons, "Press Start") follow the original's device-specific variants when present. A browser-specific prompt is an enhancement.
- The neutral demo's CSS fonts and procedural menus are synthetic and must never appear in a game adapter.
