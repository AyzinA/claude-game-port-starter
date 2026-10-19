# 10 — Safety, licensing and source integrity

This is engineering guidance, not legal advice. Rules vary by jurisdiction and game license.

## Ground rules

- Require lawful, authorized access to the original installation.
- **Never redistribute proprietary original game assets, sound, models, scripts, full decompilations, or executable bytes in Git/public releases.** Users provide their own game installation.
- Maintain separation between documentation of external behavior and implementation, with attribution/license checks for third-party open-source reference code.
- Do not bypass DRM, anti-cheat, online authentication or protected asset access. If required for feasibility, record as a blocker and request a lawful alternative.
- Avoid circumventing mod signatures, escalating permissions, or introducing executable untrusted mod content into a browser.
- Do not launch or modify unknown game executables without the user's approval and an appropriate safe environment.
- Keep local paths, usernames, secrets, API tokens, original saves and installation metadata out of version control.

## Security review of imports

All game files and mods are untrusted input. Validate paths, archive offset/length, decompressed size, Unicode/duplicate collisions, format magic, file signatures, pixel/mesh counts and recursive object depth. Apply time/memory caps. Prefer Web Workers for parsing. Treat `.js`, `.html`, `.dll`, `.exe`, `.so`, `.dylib`, and similar executable artifacts as **data to ignore or reject**, not behavior to execute.

## No automatic network publication

The user's files remain on-device. Do not upload to cloud storage, publish a game build with its original assets, host the game directory publicly, or push a commit containing them.

## Stop gate

If the requested game cannot be implemented legally or technically under the target constraints, explain the blocker and offer a reduced or independent original-content alternative rather than claiming success.
