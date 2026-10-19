# 03 — Feasibility gate and verdict rules

## Verdicts

- **GO:** evidence supports original asset access, feasible main rendering/logic path and an achievable useful browser vertical slice without prohibited dependencies. Full parity can still be high effort.
- **CONDITIONAL:** likely possible for a named subset, but specific blockers (e.g. unsupported FMV, native extensions, proprietary network, heavy performance constraints) need explicit user acceptance. Separate prototype feasibility from full-game feasibility.
- **NO-GO:** essential target behavior depends on unavailable rights/content/services, bypassing access restrictions, or a fundamental missing technical dependency that cannot be legitimately replaced for the proposed scope.
- **UNKNOWN:** too little evidence; list exact next probes. Unknown is **not** permission to start claiming complete support.

## Required report structure

Use `project/FEASIBILITY_REPORT.md` template and address:

1. Exact game, edition and ownership/access assumptions.
2. Installation inventory overview (not private exact path in shareable docs).
3. What can be parsed directly, converted locally, or needs reverse engineering.
4. How gameplay logic is implemented: existing VM, script translation, native reimplementation or online servers.
5. Rendering and browser/WebGPU/WebGL compatibility; audio/video codecs; memory/performance.
6. Mod side-loading: which existing formats work, which require adapters, which are impossible without native plugins.
7. DRM/anti-cheat/network/legal restrictions, unknowns and safe alternatives.
8. Verdict **separately** for desktop prototype, full single-player game and mobile.
9. Effort categories (low/medium/high/research), major unknowns and first 2-week technical risks (not fabricated calendar deadline).
10. Proposed first vertical slice, test plan and explicit GO/CONDITIONAL authorization gate.

## Hard blockers checklist

- Offline game unavailable without external service.
- Signed encrypted assets with no authorized decoding path.
- Native code mods demanded but no equivalent sandbox permitted.
- Required network protocols/server data unknown.
- No legal/authorized access to installation.
- Browser can't support critical OS APIs without substantial replacement.

## GO/CONDITIONAL process

A GO verdict means the agent may proceed with the user's original implementation request. Conditional requires the user to accept named compromises, e.g. single-player only, desktop only, assets unavailable, scripts unsupported. NO-GO and UNKNOWN require stopping game-specific build work, reporting blocker/next research, and optionally offering a reduced proof of concept.
