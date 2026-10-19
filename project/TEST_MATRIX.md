# Test matrix

| Test | Synthetic / original | Expected | Status | Evidence |
|---|---|---|---|---|
| Neutral scene renders | synthetic | spinning 3D object | not run | `pnpm dev` |
| VFS override precedence | synthetic | high-priority wins | not run | `pnpm test` |
| Unsafe ZIP virtual path | synthetic | rejected/skipped | not run | `pnpm test` |
| Original game asset loads | original | chosen game-specific resource renders | blocked | game unselected |
| Quest script executes | original | correct state transition | blocked | game unselected |
| Mod native format works | original mod | resource override | blocked | format unknown |
