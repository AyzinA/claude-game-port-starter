# Engine compatibility matrix

**Target game not selected.** Status values: missing, partial, implemented-unverified, verified-original, inferred, blocked, not-applicable. Per-screen/level progress lives in `project/PLAYTHROUGH_MAP.md`; this matrix tracks the **subsystems** those nodes depend on.

| Area | Original reference | Implemented | Fidelity status | Tests | Next action |
|---|---|---|---|---|---|
| Game source detection | None | Library index + `npm run inventory` engine fingerprint | missing | scripts tests | Run inventory on real install |
| Archives | None | Basic VFS overlay (not original format) | missing | VFS unit | Research game containers |
| Game flow (boot → credits) | None | Generic GameFlow + demo adapter | missing | flow + playthrough tests | Map original screens |
| Original UI (layouts, fonts, HUD) | None | UiScreen, bitmap fonts, Canvas renderer | missing | UI unit | Decode original fonts/UI textures |
| Input bindings | None | Action input (keys, gamepad, pointer) | missing | input unit | Original default bindings |
| World rendering | None | Demo grid scene | missing | e2e screenshot | Decode original world |
| Characters/animation | None | None | missing | — | Discover formats |
| Scripts/native gameplay | None | None | missing | — | Research runtime |
| Cutscenes/video | None | None | missing | — | Identify codecs (docs/19) |
| Audio/music | None | None | missing | — | Identify formats |
| Save/load | None | None | missing | — | Game model and schema |
| Mod sideload | Internal ZIP data preview | Limited | partial | VFS/ZIP | Native mod adapter |
