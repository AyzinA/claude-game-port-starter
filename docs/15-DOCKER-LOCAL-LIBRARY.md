# 15 — Docker, automatic game discovery and local mods

## Recommended directory layout

```text
Game Port Lab/
├── Dockerfile
├── compose.yaml
├── public/
│   ├── game/
│   │   ├── game.json              # optional: {"id":"my-game","name":"My Game"}
│   │   ├── Data/                  # original game data, read-only
│   │   └── ...
│   └── mods/
│       ├── sky-pack/
│       │   ├── mod.json           # targetGame must match game.json id
│       │   └── assets/
│       │       └── Data/...       # relative virtual paths
│       └── another-mod.zip        # root mod.json + assets/**
└── ...
```

`public/game` can also contain an entire copied installation tree. `.exe`, `.dll`, native plugins and browser scripts are not served as assets; the selected game still needs a researched browser-compatible engine adapter.

If `game.json` is absent but game files exist, the neutral shell uses profile ID `local-game` and the agent asks for the game's **name only if it cannot identify it from files**. To preselect a profile, create `game.json` with a stable ID and friendly name. Do **not** put credentials or sensitive installation paths in either manifest.

## Docker quick start

```bash
# Create folders if needed. Copy game assets to public/game or mount external directories.
mkdir -p public/game public/mods

docker compose up --build -d
# Browse http://localhost:5317

docker compose logs -f
# Stop:
docker compose down
```

On Windows PowerShell, create the folders using `New-Item -ItemType Directory -Force public/game,public/mods` if needed; Docker Compose commands are otherwise the same.

Docker Compose publishes **127.0.0.1:5317** only. Inside the container Node binds `0.0.0.0:5317`, which is necessary for Docker port forwarding. **Never publish this image directly on the Internet**: the local API serves your original game data to visitors who can reach it. For remote use, use a private authenticated reverse proxy or VPN and review your game license.

The container uses read-only directory mounts and a read-only application filesystem. Game/mod data are not baked into the image (`.dockerignore`) or committed to Git (`.gitignore`).

### Optional external read-only mounts

Edit the Compose `volumes` section if the installations are outside this repository, e.g.:

```yaml
volumes:
  - /your/authorized/game/install:/app/public/game:ro
  - /your/local/mods:/app/public/mods:ro
```

Keep `public/game` and `public/mods` as the **paths inside the container**. Docker Desktop must have permission to mount the host source folders.

## Development without Docker

```bash
npm install
npm run dev
```

The Vite development server is also loopback-only and uses the **same** local library service. `npm run build` sets `publicDir: false`, ensuring original assets are **not copied to dist**. `npm start` serves the built shell on localhost.

## Automatic import semantics

1. When the browser opens, `GET /api/local-library` indexes allowed files in `public/game` and compatible mod packages in `public/mods`.
2. If it finds any game files, it registers the game's paths at VFS priority 0, sets the profile ID, and **hides the manual game folder selection**.
3. It mounts matching folder mods and ZIP mods at their manifest priority (default 300) in deterministic order. Mod conflicts are displayed.
4. Assets remain **lazy**: the VFS stores same-origin resource URLs; bytes are fetched only when a game-specific parser requests a file. Large games do not load into browser memory on startup.
5. If `public/game` contains no assets, the usual browser folder picker remains available. After manual selection, compatible folder/ZIP mods from `public/mods` are also auto-mounted according to the selected game profile ID.
6. Reloading the browser re-indexes the local folders and mods; to apply changes to game files, reload the page. Savegame/mod-set compatibility must be implemented by the game-specific adapter.

### Folder mod manifest

`public/mods/sky-pack/mod.json`:

```json
{"id":"sky-pack","name":"Sky Pack","version":"1.0","targetGame":"my-game","priority":300}
```

Place content beneath `public/mods/sky-pack/assets/` relative to the game's VFS paths. A ZIP mod follows the same internal layout. ZIP preview max: 30 MiB compressed, 128 MiB expanded, 1,200 entries; larger native formats require game-specific streaming adapters.

## Security and scope

- **Private LAN/localhost only:** local file URLs are read-only but do not require authentication. Never expose the port to untrusted clients.
- Reject path traversal, symlinks, hidden files, and executable/native mod files. ZIP extraction is limited but not a hardened universal archive sandbox.
- Game bytes stay on your host and are served on demand to your **local browser**; they are not bundled in the Docker image. Browser-side imported archives are not uploaded to third-party services.
- The neutral shell **only indexes** original files; it cannot automatically interpret an arbitrary game's assets/scripts or run the original binary. Claude Code still performs the research and feasibility work before implementing the game-specific engine.
- Docker runs the web app. The Claude Code CLI is a separate developer tool and is **not** installed or automatically executed inside the game container.

## Validation

```bash
npm run test:server
npm run typecheck
npm run test
npm run build
```

In a Docker-enabled environment, run `docker compose up --build` and check `http://localhost:5317/api/local-library` and the UI. Verify the built `dist` does not include anything from `public/game` or `public/mods`.
