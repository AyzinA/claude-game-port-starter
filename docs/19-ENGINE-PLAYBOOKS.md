# 19 — Engine playbooks

`npm run inventory` fingerprints the installation, including the contents of APK/IPA/OBB/JAR packages (names only). It links each engine candidate to a section below. These are starting points for research, not verdicts. Confirm the engine version from original files, then follow docs/02 and docs/03.

**Licenses:** tools named below are references for format knowledge. Check each license before reading or reusing its code, and record what you used in `project/SOURCE_LEDGER.md`. Copyleft code (GPL) must not be copied into this project unless you deliberately choose that license for the whole port (`project/DECISIONS.md`).

## Strategy tiers

| Tier | When | Fidelity / effort | Notes |
|---|---|---|---|
| **A. Original runtime in the browser** | An official or open runtime of *the same engine* can execute the original data and scripts in a browser (e.g. SWF via Ruffle, LÖVE via love.js, RPG Maker MV/MZ's own HTML5 runtime, same-version Godot web export, DOS via DOSBox-based emulators) | Highest fidelity, lowest effort | Not a Three.js codebase. This needs an explicit, recorded decision, a runtime license check, and an isolated origin if the original ships JavaScript. Keep the playthrough map and screenshot verification. |
| **B. Script VM + engine services in TypeScript** | Game logic is bytecode or scripts for an engine VM (GameMaker bytecode, Daedalus, RGSS Ruby, Lua, Papyrus…) | High fidelity, medium-high effort | Implement the VM and its external functions; render with Three.js/Canvas through the adapter. |
| **C. Clean-room reimplementation** | Logic is native code (C++, IL2CPP, Blueprints compiled to native…) | Fidelity limited by evidence, highest effort | Rebuild observable behaviour subsystem by subsystem against reference runs. |

Always look for a tier-A or tier-B path before committing to C.

<a id="unity"></a>
## Unity

- **Data:** serialized files (`globalgamemanagers`, `levelN`, `sharedassetsN.assets`, `resources.assets`), AssetBundles (`UnityFS`), streaming assets. Type trees vary by Unity version: read the version from `globalgamemanagers`.
- **Logic:** Mono builds keep IL in `Managed/Assembly-CSharp.dll` (behavioural reference only, don't copy). IL2CPP builds compile C# to native code plus `global-metadata.dat`. Both are tier C in practice.
- **UI:** uGUI (Canvas/RectTransform in scene/prefab data; anchors map well to `UiScreen`). TextMeshPro fonts are **SDF atlases**: add an SDF text renderer (a shader) instead of treating them as bitmap fonts. Legacy `Font` assets are bitmap or dynamic.
- **Reference tools:** UnityPy, AssetStudio, AssetRipper (check licenses).

<a id="unreal"></a>
## Unreal Engine

- **UE4/5:** `.pak` (and IoStore `.utoc/.ucas` from 4.26), `.uasset/.umap`. **Paks are often AES-encrypted.** Obtaining or using the key is a docs/10 legal question: treat it as a blocker unless it's clearly authorized. Logic is in C++ and Blueprints (Kismet bytecode inside assets). UI is UMG widget blueprints. Usually CONDITIONAL, tier C.
- **UE1–3:** packages (`.u/.upk/.utx/.unr`), UnrealScript bytecode (a tier-B candidate), often compressed packages in UE3.
- **Reference tools:** CUE4Parse/FModel, UE Viewer (UModel).

<a id="godot"></a>
## Godot

- **Data:** `.pck` (standalone or appended to the executable). Read the engine version from the pack header.
- **Tier A:** a matching-version Godot web export template may run the original pack if the game uses GDScript only (no C#/native GDExtension). Godot 4.0–4.2 web builds need cross-origin isolation headers.
- **UI:** Control nodes in `.tscn/.scn` scenes; fonts as `.fnt`/dynamic/MSDF.
- **Reference tools:** GDRE Tools (gdsdecomp).

<a id="gamemaker"></a>
## GameMaker

- **Data:** `data.win` / `game.unx` / `game.ios` / `game.droid`: IFF `FORM` with chunks (`GEN8`, `STRG`, `TXTR`, `SPRT`, `BGND`, `ROOM`, `OBJT`, `CODE`, `FONT`, `AUDO`…). Fonts and rooms map directly to `BitmapFontData` and levels.
- **Logic:** VM builds contain GML bytecode, so tier B. **YYC** builds compile to native code (no `CODE` bytecode), so tier C.
- **Reference tools:** UndertaleModTool (GPL; format knowledge only).

<a id="rpgmaker-mvmz"></a>
## RPG Maker MV / MZ

- Already HTML5 (PIXI.js + game JSON in `data/`, plugins in `js/plugins`). **Tier A:** serve the game's own `www`/root folder from an isolated origin. This repo's library deliberately never serves `.js`, so that is a separate, user-approved setup recorded in DECISIONS. Encrypted assets (`.rpgmvp/.png_`, etc.) are decoded by the engine at runtime.
- Tier B alternative: reimplement the map/event interpreter against `data/*.json`.

<a id="rpgmaker-rgss"></a>
## RPG Maker XP / VX / VX Ace (RGSS)

- **Data:** `Game.rgssad/.rgss2a/.rgss3a` archives; `Data/*.rxdata/.rvdata/.rvdata2` (Ruby Marshal); scripts in `Scripts.*` (zlib-compressed Ruby).
- **Tier B:** run the original Ruby scripts in a browser Ruby VM (e.g. ruby.wasm) on top of a TypeScript implementation of the RGSS API (Bitmap, Sprite, Window, Input, Audio). mkxp/mkxp-z document RGSS behaviour (GPL: reference only).
- **UI:** RGSS Window skins (`Graphics/System/Window.png`) and bitmap text. Menus are scripts, so they come for free once RGSS works.

<a id="renpy"></a>
## Ren'Py

- **Data:** `.rpa` archives, `.rpyc` compiled scripts, the `renpy/` runtime. **Tier A:** Ren'Py has an official web platform. It usually needs the project in source form; check the game's license and Ren'Py version.
- **UI:** screen language (`screens.rpy`). Text uses TTF fonts shipped with the game, so CSS `@font-face` with the *original* font file is legitimate here.

<a id="source"></a>
## Source / GoldSrc

- **Data:** VPK, BSP (VBSP), MDL/VVD/VTX models, VTF textures, VMT materials, WAD3 (GoldSrc). Formats are well documented.
- **Logic:** native `server/client.dll`, entity I/O in maps, so tier C. UI is VGUI/Scaleform/Panorama, depending on the game.

<a id="idtech"></a>
## id Tech 1–3

- WAD/PAK/PK3 and BSP formats are thoroughly documented. Several engines have GPL source releases: building on them makes the port GPL. Decide explicitly.

<a id="flash"></a>
## Adobe Flash / AIR

- **Tier A:** Ruffle runs SWF in the browser (AVM1 mature, AVM2 improving). Check which ActionScript version the game uses, and test against the playthrough map.

<a id="xna"></a>
## XNA / FNA / MonoGame

- **Data:** `.xnb` (often LZX-compressed) content. Logic is .NET IL in the game assembly, so usually tier C. Experimental WebAssembly builds of FNA exist, but they need recompiling the game's code, which is normally not possible without source.

<a id="love2d"></a>
## LÖVE

- A `.love` file (or a fused exe) is a ZIP of Lua source plus assets. **Tier A:** love.js runs LÖVE 11.x games in the browser.

<a id="html5"></a>
## Electron / NW.js / Construct / other HTML5

- Already web technology (`resources/app.asar`, `package.nw`, `c2runtime.js`/`c3runtime.js`). Tier A: host the original web build from an isolated origin, with the same JavaScript caveat as RPG Maker MV/MZ. Remove or replace Node/desktop-only APIs only with a recorded decision.

<a id="cocos"></a>
## Cocos2d-x / Cocos Creator

- Lua or JS scripts (`.luac`/`.jsc`), often XXTEA-encrypted with a key embedded in the native library: docs/10 blocker unless authorized. Cocos Creator games may have an official web build path, but only for the developer.

<a id="defold"></a>
## Defold

- `game.arcd/.arci/.dmanifest/.projectc` archives; Lua logic. Defold's HTML5 target needs the project, so tier B (Lua VM + engine API) otherwise.

<a id="clickteam"></a>
## Clickteam Fusion

- Event-sheet logic compiled into the data; formats are community-documented only. Tier B (event interpreter).

<a id="kirikiri"></a>
## Kirikiri / KAG

- XP3 archives (frequently with game-specific encryption, so check docs/10). TJS2/KAG scripts mean tier B.

<a id="zengin"></a>
## ZenGin (Gothic 1/2)

- VDF archives, ZEN worlds, MRM/MDH/MDM models, Daedalus script bytecode (`.DAT`), so tier B for scripts with a tier-C engine. Open references exist (e.g. ZenKit, OpenGothic): check licenses.

<a id="gamebryo"></a>
## Gamebryo / Creation

- BSA/BA2 archives, NIF models, ESM/ESP records, Papyrus bytecode (`.pex`) on Creation games. Very large scope; expect CONDITIONAL.

<a id="java"></a>
## Java / libGDX

- JARs with JVM bytecode. JVM-in-browser runtimes (TeaVM needs source/bytecode compilation; CheerpJ runs JARs and has its own license terms) may give a tier-A path. Otherwise tier C.

<a id="dos"></a>
## DOS

- Emulation (DOSBox-based, e.g. js-dos) is the faithful tier-A path. Check the emulator license (GPL), and record that the deliverable is an emulator host rather than a Three.js port.

<a id="mobile"></a>
## Android / iOS packages

- **APK/XAPK/AAB:** ZIP with `classes.dex` (Java/Kotlin), `lib/<abi>/*.so` (native), `assets/` (engine data). `.obb` expansion files hold the bulk data. The inventory scans inside packages, so the inner engine (Unity, GameMaker, Cocos, Godot…) shows up as a candidate. Follow that engine's playbook.
- **IPA:** `Payload/<App>.app/`. App Store binaries are FairPlay-encrypted, and decrypting them is DRM circumvention, so that's a blocker. Resources are usually unencrypted and readable.
- **Controls/UI:** touch layouts become pointer input on `UiScreen`; virtual sticks become actions. Keep the original touch UI on mobile browsers; desktop key bindings are an enhancement.

## Media without browser decoders

Bink, Smacker, CRI USM, Wwise `.wem` and FMOD `.fsb` don't play natively in browsers. Options, in order of preference:

1. A clean-room or license-compatible decoder in TS/WASM (record the license).
2. **Local conversion by the user:** convert the files on their machine (e.g. with FFmpeg) to WebM/Ogg. Place them as a local data mod `public/mods/<game-id>-media/` (`mod.json` + `assets/<original path>.webm`). The adapter prefers `<path>.webm` when present. Nothing is committed, and the original files stay untouched.
3. Mark the cutscene nodes `blocked` with the exact codec.
