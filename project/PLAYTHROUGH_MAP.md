<!-- playthrough-map:template -->
# Playthrough map: boot to end credits

**Game:** NOT SELECTED · **Edition:** — · **Full autoplay script:** — · **Last full run:** —

> **Template.** The playthrough-cartographer agent replaces this file after the feasibility gate, using original data (docs/16 §1), and deletes the template marker on line 1. Until then, `npm run playthrough` and the autopilot treat the map as not initialized.
>
> Status: `todo` · `researching` · `in-progress` · `implemented` · `verified` · `blocked` · `n/a`. A node is `verified` only when the `full` autoplay script reaches it with player inputs only and it has been compared with original evidence. Every `blocked` row names its blocker and what would unblock it.

## Front end

| ID | Kind | Name | Entry → Exit | Original evidence | Depends on | Status | Verification |
|---|---|---|---|---|---|---|---|
| FE-BOOT | boot | Boot / startup | launch → first logo | executable/startup config | VFS, edition detection | todo | — |
| FE-LOGOS | splash | Publisher/engine logos | boot → intro | video/texture names | video or UI images | todo | — |
| FE-INTRO | cutscene | Intro movie | logos → title | video file | video decoder | todo | — |
| FE-TITLE | title | Title / press start | intro → main menu | menu data | UI, fonts, input | todo | — |
| FE-MAIN-MENU | menu | Main menu | title → each entry | menu layout + strings | UI, fonts, audio | todo | — |
| FE-NEW-GAME | menu | New game / difficulty | main menu → first level | menu data | UI | todo | — |
| FE-LOAD | menu | Load game | main menu → saved level | save format | save/load, UI | todo | — |
| FE-OPTIONS | menu | Options (add one row per sub-page) | main menu ↔ options | options layout | UI, settings store | todo | — |
| FE-CREDITS | credits | Credits from menu | main menu ↔ credits | credits file | UI, fonts | todo | — |

## Gameplay (one row per level / mission / chapter, in story order)

| ID | Kind | Name | Entry → Exit | Original evidence | Depends on | Status | Verification |
|---|---|---|---|---|---|---|---|
| GP-01 | gameplay | First level | new game → level exit | level list | world, player, HUD | todo | — |

## In-game systems with their own UI

| ID | Kind | Name | Entry → Exit | Original evidence | Depends on | Status | Verification |
|---|---|---|---|---|---|---|---|
| SYS-HUD | overlay | HUD | gameplay | HUD layout | UI | todo | — |
| SYS-PAUSE | overlay | Pause menu | pause key ↔ gameplay | menu data | UI, input | todo | — |
| SYS-LOADING | loading | Loading screens | between levels | loading textures/tips | UI | todo | — |
| SYS-GAME-OVER | menu | Game over / retry | death → retry/menu | script/menu data | UI, save/load | todo | — |

## Cutscenes

| ID | Kind | Name | Entry → Exit | Original evidence | Depends on | Status | Verification |
|---|---|---|---|---|---|---|---|

## Ending

| ID | Kind | Name | Entry → Exit | Original evidence | Depends on | Status | Verification |
|---|---|---|---|---|---|---|---|
| END-FINAL | gameplay | Final sequence | last level → ending | level/script data | gameplay | todo | — |
| END-CREDITS | credits | End credits | ending → credits end | credits file/script | UI, fonts, audio | todo | — |
| END-RETURN | menu | Return after credits | credits end → menu/NG+ | script data | flow | todo | — |
