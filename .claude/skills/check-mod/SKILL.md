---
name: check-mod
description: Validate mod sideload packages against a selected game's formats, security constraints, load order, and saved-game compatibility.
---

# /check-mod

Read `docs/07-MODS.md`, `docs/10-LEGAL-SECURITY.md`, intake and feasibility report. Require a game profile and a path to user-owned mod files (read-only). Identify the mod type: assets/data/VM script/native plugin/server. Inspect metadata safely, check original game version, file path conflicts, load-order resolution, archive size and whether executable code would be required. Never execute the mod during inspection. Report supported/conditional/unsupported and the exact adapter needed; only integrate permitted data packages through the VFS.
