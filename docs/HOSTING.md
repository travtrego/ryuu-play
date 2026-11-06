# Hosting RyuuPlay

A comparison of ways to run this fork so you can play against the bot from a
browser, with the exact steps for each. **Nothing here has been deployed and no
accounts or services have been created** — this is for you to choose from.

The short version: **run it on your own machine first.** It needs no database
server and no paid host, and the one-command Docker path works today. Move to a
paid host only when you want to reach it from outside your network.

## What the app actually needs

Measured against this repo, not assumed:

| Need | Detail |
| --- | --- |
| Node | 18.20.8 (`.nvmrc`), as the Docker image also uses |
| One long-lived process | `start.js` serves the REST API, the websockets **and** the web UI from one port (12021 by default) |
| Websockets | `socket.io`, long-lived connections |
| Persistent disk | database, `avatars/`, `scans/` |
| CPU | the bot runs **in-process** (`BotManager`), so a bot game is real work on the server |
| Database | SQLite or MySQL — see below |

Two consequences worth stating plainly:

- **Static and serverless hosts cannot run the server.** GitHub Pages, Netlify
  and Vercel's static tiers have no long-lived process, no websockets and no
  persistent disk. They could serve `packages/play` alone, but then you still
  need somewhere for the server, and the Docker image already serves both.
- **The build is much heavier than the run.** Building `packages/play` is an
  Angular production build; running the server afterwards is comparatively
  light. On a small host, build elsewhere and ship the image — don't build on
  the box.

## SQLite works: no database server needed

`config.storage` defaults to MySQL, but `Storage.connect()` spreads that config
straight into TypeORM with `synchronize: true`, and **`sqlite3` is already a
production dependency of `packages/server`**. So switching is config, not code:

```js
config.storage = { type: 'sqlite', database: '/path/to/data/ptcg.sq3' };
```

**Verified on 2026-10-31** on Node 18.20.8: the server started, created
`ptcg.sq3`, synchronized all seven tables (`avatar`, `conversation`, `deck`,
`match`, `message`, `replay`, `user`) and answered HTTP on its port.

Not verified: a full game played through the UI on SQLite, concurrent
websocket load, or the long-running scheduler tasks. For one player plus a bot
this is very unlikely to matter; for a public server with many users, MySQL is
the better-trodden path.

This is the finding that makes the free option cheap: **no MySQL to install,
run, back up or secure.**

## Option A — your own machine (free)

Best for learning to play, which is what this fork is for. No cost, no account,
no exposure to the internet.

### A1. Docker (simplest)

`docker-compose.yml` and `docker/Dockerfile` already exist. The Dockerfile
clones a repo at build time and defaults to **upstream** `keeshii/ryuu-play`,
so point it at this fork:

```yaml
# docker-compose.yml
build:
  context: docker
  dockerfile: ./Dockerfile
  args:
    REPO: "https://github.com/travtrego/ryuu-play.git"
    TAG: "master"
    EXTERNAL_URL: "http://localhost:12021"
```

```bash
docker compose up --build -d     # first run builds the image
# open http://localhost:12021
docker compose logs -f ryuu_play
docker compose down              # data survives in the ryuu_play_data volume
```

The image serves the UI and the API on 12021 and keeps the database, avatars
and `init.js` in a named volume.

**Known risk, not yet hit in this environment:** the Dockerfile runs a plain
`npm install` at the repo root. Per `docs/BUILD.md`, a root install pulls
`packages/cordova`, whose `cordova-plugin-statusbar-patched` is a **plain-HTTP
tarball on a third-party host**. On a network that blocks plain HTTP, or if that
host is down, the image build fails. If that happens, use A2, or change the
Dockerfile to the scoped install from `docs/BUILD.md`.

### A2. Straight from the checkout (no Docker)

```bash
nvm use                                   # 18.20.8 from .nvmrc
npm ci --include-workspace-root \
  -w packages/common -w packages/sets -w packages/simple-bot \
  -w packages/server -w packages/play
npm run compile -w packages/common
npm run compile -w packages/sets
npm run compile -w packages/simple-bot
npm run compile -w packages/server
npm run build -w packages/play -- --configuration=production
```

Then an `init.js` beside `start.js`:

```js
const { config } = require('@ptcg/server');
config.storage = { type: 'sqlite', database: __dirname + '/data/ptcg.sq3' };
config.backend.avatarsDir = __dirname + '/data/avatars';
config.sets.scansDir = __dirname + '/data/scans';
config.backend.webUiDir = __dirname + '/packages/play/dist/ptcg-play';
```

```bash
mkdir -p data && node start.js --init=./init.js
# open http://localhost:12021
```

`packages/play/src/environments/environment.prod.ts` points `apiUrl` at
`https://ptcg.ryuu.eu`; set it to your own URL before the production build, as
the Dockerfile does with `EXTERNAL_URL`.

### A3. Your machine, reachable from outside

Only if you want to play from a phone or share with someone. A tunnel
(Cloudflare Tunnel, Tailscale) avoids opening a port on your router, and avoids
paying for a host. Your machine has to be awake for the game to work.

## Option B — a small paid host

Worth it when you want the game reachable without your machine running.

**What to look for**, in priority order:

1. **A persistent disk or volume.** Platforms that reset the filesystem on
   every deploy will lose the database. This rules out several "free tier" app
   platforms unless you also pay for managed storage.
2. **Websocket support** on long-lived connections, with no aggressive idle
   timeout.
3. **No forced sleep.** Free tiers that idle after ~15 minutes make a bot game
   unusable — the websocket drops mid-game.
4. **1 vCPU / 1 GB RAM minimum**, 2 GB comfortable. Sizing is for the *runtime*;
   build the image in CI or locally and push it, rather than building on a small
   box.

**Shape of the options** (check current pricing yourself — these move):

| Class | Fits | Watch out for |
| --- | --- | --- |
| Small VPS (Hetzner, DigitalOcean, Vultr…) | Best fit. Docker + a volume, full control | You patch and back it up yourself |
| Container PaaS (Fly.io, Render, Railway…) | Good if it offers a real persistent volume | Free tiers sleep and/or have ephemeral disk |
| Managed k8s / serverless containers | Overkill here | Ephemeral disk, websocket limits |
| Static hosts (Pages, Netlify, Vercel static) | **Cannot run the server** | — |

A VPS is the straightforward choice: it's the environment the existing Docker
setup was written for.

### Steps, once you've picked a host

1. Build the image from this fork (locally or in CI) and push it to a registry,
   or build on the host if it has the RAM.
2. Create a persistent volume and mount it at
   `/home/node/ryuu-play/data`.
3. Set `EXTERNAL_URL` to the public URL **at build time** — the Angular bundle
   bakes `apiUrl` in; changing it later means rebuilding.
4. Put TLS in front (the host's load balancer, or Caddy/nginx). Websockets must
   be proxied, not just HTTP.
5. In `init.js` on the volume, set a real `config.backend.secret` and decide
   `registrationEnabled` / `serverPassword` — defaults are `'!secret!'` and open
   registration, which is fine on your own machine and **not** fine in public.
6. Back up the volume: for SQLite that is one file.

## Recommendation

**Start with A1 (Docker, locally).** It costs nothing, needs no decision you
can't reverse, and it is the fastest route to actually playing the bot — which
is the point of the learn-mode work. If the image build hits the cordova
tarball problem, A2 takes a few more commands and avoids it entirely.

Revisit Option B only when "I want to play from my phone, without my laptop on"
becomes a real want. At that point A3 (a tunnel) is the cheap middle step, and a
small VPS is the honest answer if you want it always-on.

## Before anything goes public

- Change `config.backend.secret` from `'!secret!'`.
- Decide on `registrationEnabled` and `serverPassword`.
- `synchronize: true` lets TypeORM alter the schema on boot. Convenient here,
  but back the database up before upgrading the server.
- Card scans are downloaded on first boot (`downloadMissingScans`); the volume
  needs room for them.
