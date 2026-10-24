# 16 — Boot-to-credits: the definition of a complete port

The target of every port is the **whole game as the player experiences it**: from launching the executable, through logos, intro, title screen and every menu, through all gameplay, cutscenes and branches, to the end credits and back to the menu. The original UI is part of it. A port that plays well but uses invented menus is not done.

`project/PLAYTHROUGH_MAP.md` turns that target into a finite, checkable list. **The port is done when every map node is `verified`, `blocked` with a stated reason, or `n/a`**, and the `full` autoplay script runs from boot to the credits in the browser.

## 1. Build the map (the playthrough-cartographer agent)

Build the map right after a GO, or after you accept a CONDITIONAL verdict, before writing game-specific code. Derive it from **original data first** and public references second:

| Source | What it gives you |
|---|---|
| Executable strings / startup config | logo/intro video names, boot order, first menu |
| Menu/layout definitions (scripts, XML, layout files, Flash/Scaleform movies, prefabs) | every front-end screen and its buttons |
| String tables / localization | screen titles, button labels, options entries |
| Level/mission/chapter lists, map files, world scripts | gameplay segments in order |
| Quest/dialogue/story scripts | branches, required story beats, multiple endings |
| Video folder | intro, in-game cutscenes, ending movies |
| Credits file / credits script | end-credits content and trigger |
| Save format / save slots | what "load game" must restore per segment |
| Public walkthroughs, wikis, manuals | *structure only* (order, branches, unlocks); cite them in SOURCE_LEDGER |

### Node taxonomy

Use stable IDs with a prefix per section. Granularity: one node per **screen** in the front end, and one per **level, mission or chapter** in gameplay. Split a node only when the halves can be verified separately.

| Prefix | Section | Examples |
|---|---|---|
| `FE-` | Front end | boot, publisher/engine logos, intro movie, attract mode, title / press start, main menu, new game, difficulty, load game, save slots, options (one node per sub-page: video, audio, controls, gameplay, language), extras, credits from menu, quit/confirm |
| `GP-` | Gameplay | each level/mission/chapter/area, hub, tutorial, boss fights, minigames |
| `SYS-` | In-game systems with their own UI | HUD, pause menu, inventory, map, journal/quest log, dialogue box, shop, skill tree, save/load in game, game over/retry, loading screens |
| `CS-` | Cutscenes | in-engine and pre-rendered scenes, by story order |
| `END-` | Ending | final boss/sequence, each ending branch, end credits, post-credits, return to menu, new game+ unlocks |

Each node records **entry → exit conditions** (how the original reaches it and leaves it), the subsystems it **depends on**, its original **evidence**, its **status**, and how it was **verified**.

### Status vocabulary

`todo` → `researching` → `in-progress` → `implemented` → `verified` · or `blocked` · or `n/a`

- `implemented`: works in the port, but has not yet been compared with the original.
- `verified`: reached by autoplay *with player inputs only*, and compared against original evidence (see §4).
- `blocked`: must name the exact blocker and what would unblock it (e.g. "Bink 2 video decoder: user to provide locally converted WebM via docs/19 §video").
- `n/a`: does not exist in this edition (e.g. no attract mode). Cite the evidence.

`npm run playthrough` prints progress and the next node. It is also what the autopilot reads.

## 2. Work order

Work in dependency order so every step is runnable:

1. **Boot path:** VFS mounts, edition detection, startup config → `FE-BOOT`.
2. **UI foundation:** decode original fonts and UI textures, virtual resolution, input bindings (docs/17).
3. **Front end:** logos → intro → title → main menu → options pages. The whole front end should be navigable early, even while "New Game" leads to an `implemented`-but-incomplete level.
4. **First level, end to end:** world, player, camera, collision, HUD, pause, level exit.
5. **Remaining gameplay in story order**, adding mechanics as nodes require them. Shared systems (`SYS-`) are verified on the first node that uses them.
6. **Cutscenes and ending:** ending sequence, credits, return to menu.
7. **Breadth:** branches, alternate endings, unlockables, every options page.

Pick the earliest node in this order whose dependencies are implemented. When something genuinely blocks you, mark the node `blocked` and continue with independent nodes.

## 3. Autoplay: proving the flow

Every adapter exports `autoplay` scripts (`src/engine/Automation.ts`):

- **`full`**: starts at boot and reaches the end credits using **only player inputs** (`press`, `hold`, `wait`, `expect`). It never edits game state. Add a `checkpoint` step with the node ID whenever the run reaches a map node. This one script is the boot-to-credits proof.
- **`segment`**: short scripts for fast iteration on one node. A segment may start from an original save file or a developer warp the adapter offers. Segment runs **never** count as verification of the full flow.

Gameplay inputs must be deterministic: fixed tick, seeded RNG, no wall-clock reads in `update()`. If the original game is random, replicate its RNG, or script inputs that are robust to it (e.g. `expect` the next state with a generous `within`).

Run them:

- `npm test`: every adapter's scripts run **headless** (no rendering, so they're fast; long playthroughs take seconds to minutes).
- `npm run test:e2e`: the same scripts run in Chromium through `window.__gamePort`. Each checkpoint is saved as `test-results/playthrough/<adapter>/<NODE>.png` alongside the run report.

## 4. Verification evidence per node

| Node type | Minimum evidence for `verified` |
|---|---|
| Screen (FE/SYS) | Port screenshot vs original reference screenshot at the same virtual resolution: same layout, fonts, textures, text and focus behaviour. Navigation matches the original (which buttons, order, wrap, back behaviour). |
| Gameplay (GP) | Reached by the `full` script; entry/exit conditions match original data; mechanics it uses are listed in COMPATIBILITY_MATRIX with their own fidelity status. |
| Cutscene (CS) | Plays the original media or in-engine script at the right trigger; skippable if the original was. |
| Ending (END) | `full` script reaches it; credits content comes from original data; returns where the original returns. |

**Reference screenshots** of the original are captured by the user, or by the agent when it's allowed to run the original in a safe environment. They go in `project/private/reference/<NODE-ID>.png` (Git-ignored), at the original resolution. The E2E run attaches them next to the port screenshot. The agent compares them visually by reading both images and records the differences in the map's Verification column. If no reference exists, the node can only reach `implemented`. Ask once for the batch of missing references; don't ask node by node.

## 5. What "complete" means and does not mean

- Complete = every node terminal + `full` autoplay green headless and in the browser + COMPATIBILITY_MATRIX honest about every mechanic.
- `blocked` nodes are reported in the final summary as gaps, never hidden.
- A complete map is still not a claim of 1:1 equivalence for timing/physics/AI unless those mechanics are individually `verified (original-run)` (docs/12).
