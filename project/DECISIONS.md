# Decision log

## ADR-000 — Research first

**Status:** accepted template policy

**Decision:** Do not implement game-specific decoders or claim feasibility without source inspection and evidence-based verdict.

**Reason:** Engine formats, copyright constraints, scripting and server dependencies vary drastically by game.

## ADR-001 — Data-only mod sideload by default

**Status:** accepted template policy

**Decision:** Mod inputs can overlay virtual game data but cannot execute arbitrary code. Native plugin mods require a separate audited compatibility strategy.
