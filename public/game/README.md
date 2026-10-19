# Drop an authorized local game installation here

Place original game data inside `public/game/`, alongside an optional `game.json` containing:

```json
{ "id": "my-game", "name": "My Game" }
```

If the game has any allowed files here, the browser automatically indexes them; the manual import prompt is hidden. The neutral shell does **not** interpret game formats without a researched game-specific adapter.

Game files here are excluded from Git and Docker image builds. Docker Compose mounts this directory read-only.
