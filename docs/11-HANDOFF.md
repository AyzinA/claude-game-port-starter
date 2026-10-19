# 11 — Persistent handoff and recovery

## Every major checkpoint

Update `project/STATUS.md` with current stage, last green commands, exact blocker and next command. Update `project/DECISIONS.md` for architecture choices; `project/SOURCE_LEDGER.md` for original references; `project/COMPATIBILITY_MATRIX.md` for coverage. Keep these reports sanitized so they can be committed; private paths and protected source details belong exclusively under ignored `project/private/`.

## Handoff format

```
Current game/profile:
Gate status:
Current git branch/HEAD:
Working-tree changes not committed:
Latest verified milestone:
Commands run and exit codes:
Original source/format findings:
Open regressions:
Missing original behaviors:
Current investigation (including hypotheses rejected):
Next exact file/function/test:
Do not repeat / known caveats:
```

## Session resume

`/continue-port` reads the checkpoint and Git status, compares documented vs actual files, validates only the tests relevant to changed files, then proceeds with the next item. Do not rerun every old research query or giant test unless necessary.

## Honest autonomy

The agent can continue while the current execution session permits. It cannot promise to work after tools, context or quotas are unavailable; it must hand off state rather than claim background completion.
