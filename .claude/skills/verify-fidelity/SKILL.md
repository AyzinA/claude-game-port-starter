---
name: verify-fidelity
description: Compare a specific gameplay mechanic or rendering feature in the browser port against the legally accessible original game reference and report evidenced differences.
---

# /verify-fidelity

Ask for the exact subsystem/scenario only if not evident. Identify game version and relevant original files/scripts/native behavior. Obtain a permitted reference run or a trustworthy specification, record numeric inputs and event order, run the matching engine test, then report: confirmed match, measured deviation, cannot verify, or expected enhancement. Write a focused regression before correcting mismatches. Never claim 1:1 behavior from synthetic-only tests. Update `project/COMPATIBILITY_MATRIX.md` and `project/SOURCE_LEDGER.md`.
