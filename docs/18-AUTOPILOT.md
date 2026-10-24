# 18 — Autopilot: running the port unattended until the credits

After the feasibility gate, the slow part of a port is the long loop of *pick next screen/level → research → implement → verify*. Autopilot keeps Claude Code in that loop without waiting for a "continue" after every node.

## Pieces

| Piece | Role |
|---|---|
| `/port-autopilot` skill | The loop itself: one iteration per map node. It also turns autopilot on or off and reports status. |
| `project/PLAYTHROUGH_MAP.md` | What remains. The loop is finished when every node is terminal. |
| `.claude/hooks/autopilot-stop.mjs` (Stop hook, registered in `.claude/settings.json`) | When Claude tries to end its turn while autopilot is on and nodes remain, the hook blocks the stop and names the next node. |
| `project/private/autopilot.json` | Local, Git-ignored state: `enabled`, `continuations`, `maxContinuations` (default 40), `maxStalls` (default 3). |
| `project/private/AUTOPILOT_PAUSE` | Create this file (any content) to make the next stop succeed. Delete it to allow resuming. |
| `.claude/settings.json` permissions | Allows the routine commands (tests, typecheck, inventory, status, Playwright, read-only git) so the loop doesn't stall on prompts. It denies `git push` and any edits under `public/game/**`. |

## Safety rails (built into the hook, `scripts/lib/autopilot.mjs`)

- **Off by default.** It only runs after `/port-autopilot` enables it, and that requires a GO, or a CONDITIONAL verdict you accepted and recorded in `project/DECISIONS.md`.
- **Budget:** after `maxContinuations` forced continuations it disables itself. Run `/port-autopilot` to grant a new budget.
- **Stall detection:** if no node changes status for `maxStalls` consecutive continuations, it disables itself instead of looping.
- **Pause file** and **template map** (not yet built) always let Claude stop.
- Any hook error lets Claude stop normally.
- The hard gates still apply inside the loop: no DRM circumvention, no writes to originals, no pushing, no committing assets. If a node needs one of these, it becomes `blocked`.

## Usage

```text
/port-autopilot            # check gates, build the map if needed, enable, start looping
/port-autopilot status     # progress (same as: npm run playthrough)
/port-autopilot stop       # disable; the current iteration finishes and checkpoints
/port-autopilot GP-03      # start the loop at a specific node
```

For long unattended runs you can also start it non-interactively from a terminal in the project, e.g. `claude -p "/port-autopilot"`. Make sure the permission allowlist covers what the loop needs; anything else will be refused rather than prompted.

## What autopilot cannot do

- It cannot work after your Claude Code session, usage limits or context end. The checkpoint in `project/STATUS.md` lets `/continue-port` or `/port-autopilot` pick up again.
- It does not capture reference screenshots of the original game unless you allowed it to run the original in a safe environment. Otherwise it batches the missing references into one request (docs/16 §4).
- It won't turn a NO-GO into a port. It won't count blocked nodes as done.
