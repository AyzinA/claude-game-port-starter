# 06 — Script/VM and native-engine reconstruction

## Determine the script model from evidence

Possible source games contain Lua, Python, proprietary VM bytecode, native DLL gameplay, C++ engine rules, XML/JSON/INI data, console scripts, or no scripts at all.

Choose one of:

1. **VM/interpreter compatibility:** best when original executable ships compiled scripts with stable bytecode semantics; implement opcodes, globals, call frames, externals and persistence.
2. **Data interpreter:** when logic is declarative config/quests/state machines.
3. **Hand translation of permitted scripts:** only when volume is manageable, legality is clear and tests can establish fidelity.
4. **Native engine reimplementation:** when behavior lives in native code; reconstruct observable mechanics using permitted sources, docs and test traces.
5. **Hybrid:** often necessary. Document what is driven by script vs native logic vs data.

Do not promise that any original script can be "converted to Three.js". Three.js renders; TypeScript runtime/VM implements gameplay.

## Semantic inventory

For each function/opcode/native service: name, calling convention, input/output, side effects, scheduling, ownership, error cases, save state, game-version differences, source evidence and tests.

## Critical lifecycle

`Initialize -> enqueue native action -> advance game tick -> engine invokes callback -> script evaluates conditions -> state transitions -> save/load`. Beware reentrancy and asynchronous AI semantics.

## Coverage and fidelity

Report opcode percentage only if actual opcode denominator is known. List unbound externals by gameplay impact. A stubbed external does not count as implemented. Use an audit where `original request -> engine command -> simulated result` is observable.

## Reverse-engineering discipline

Start with published format docs, scripting docs, readable data and permitted reference traces. Decompiler output can be wrong; cross-check against executable behavior and assets. Never distribute full decompiled proprietary source in the repo. Do not bypass protection or access controls.
