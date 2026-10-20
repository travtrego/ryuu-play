# Build, test and run

Baseline established 2026-10-20. Everything below was measured on a clean
checkout.

## Node version

Pinned in [`.nvmrc`](../.nvmrc):

```
18.20.8
```

```bash
nvm install    # picks up .nvmrc
nvm use
```

No package in this repo declares an `engines` field, so the version is derived
from the tooling that is actually installed:

| Constraint source               | Declared range           |
| ------------------------------- | ------------------------ |
| `@angular/cli` 16.2.16          | `^16.14.0 \|\| >=18.10.0`  |
| `@angular-devkit/build-angular` | `^16.14.0 \|\| >=18.10.0`  |
| `@angular/core` 16.2.12         | `^16.14.0 \|\| >=18.10.0`  |
| `nyc` 17.1.0                    | `>=18`                   |
| `eslint` 8.57.1                 | `>=16.0.0`               |

The binding constraint is **Node >= 18.10**. Node 18.20.8 (latest Hydrogen LTS)
is pinned rather than a newer line because every package dev-depends on
`@types/node@^18`, so the type definitions used at compile time describe the
Node 18 API surface — pinning 18 keeps types and runtime in agreement, and 18.x
is the LTS line Angular 16 was tested against.

`package-lock.json` is `lockfileVersion: 3`, which needs npm >= 7. Node 18.20.8
ships npm 10.8.2.

**Node 20 / 22 also work.** The full pipeline (including `ng build`) was
verified green on Node 22.22.0 as well. The pin is for reproducibility, not
because newer versions are broken.

## Install

```bash
npm ci --include-workspace-root \
  -w packages/common \
  -w packages/sets \
  -w packages/simple-bot \
  -w packages/server \
  -w packages/play
```

`packages/cordova` is deliberately excluded — see
[Known gaps](#known-gaps). A plain `npm ci` at the repo root installs **all**
workspaces including cordova and fails with:

```
npm error code E405
npm error 405 Method Not Allowed - GET http://dev.ryuu.eu/distfiles/cordova-plugin-statusbar-patched-2.4.3.tar.gz
```

Use the scoped command above unless you specifically need the Android client.

## Build and test

Run the packages **in dependency order**. Each package's `main` points at its
compiled `dist/`, so a package must be compiled before anything that depends on
it can be tested:

```
common  ->  sets  ->  simple-bot  ->  server
                  \->  play
```

For each package:

```bash
npm run lint    -w packages/<name>
npm run test    -w packages/<name>
npm run compile -w packages/<name>
```

`npm run build -w packages/<name>` is just `lint && test && compile` in one go;
the three steps are listed separately so a failure is easier to place.

## Baseline results and timings

Clean checkout, Node 18.20.8, 2026-10-20.

| Step                   | Result            | Time    |
| ---------------------- | ----------------- | ------- |
| install (scoped `npm ci`) | ok             | ~2m35s  |
| common — lint          | ok                | ~3s     |
| common — test          | **243 specs, 0 failures** | ~8s  |
| common — compile       | ok                | ~10s    |
| sets — lint            | ok                | ~9s     |
| sets — test            | **516 specs, 0 failures** | ~19s |
| sets — compile         | ok                | ~25s    |
| simple-bot — lint      | ok                | ~2s     |
| simple-bot — test      | **44 specs, 0 failures** | ~5s   |
| simple-bot — compile   | ok                | ~8s     |
| server — lint          | ok                | ~2s     |
| server — test          | **35 specs, 0 failures** | ~6s   |
| server — compile       | ok                | ~12s    |
| play — lint            | ok                | ~7s     |
| play — build (`ng build`) | ok, 8.70 MB initial bundle | ~49s |

**Total: 838 specs, 0 failures.** Full pipeline from a clean checkout is about
6 minutes, of which the install is ~2.5.

## Known failing tests

None. All 838 specs pass on the pinned Node version.

If that changes, list the failing spec here with whether it is a tooling
problem or a real game-logic bug, so daily runs can tell regressions from known
breakage.

## Known gaps

- **`packages/cordova` is not installed or built.** Two separate reasons:
  1. Its `cordova-plugin-statusbar-patched` dev-dependency is fetched from
     `http://dev.ryuu.eu/distfiles/...` — a plain-HTTP tarball on a
     third-party host, outside the npm registry. Any environment that cannot
     make plain-HTTP requests (corporate proxies, sandboxed CI, anything
     HTTPS-only) fails the install, and the whole root `npm ci` fails with it.
     Replacing it with a registry-hosted package would make a full-workspace
     `npm ci` reproducible, but it changes what the Android client ships and
     cannot be verified here.
  2. Building it needs the Android SDK, which CI does not have.
- **No test runner for `packages/play`.** `npm test -w packages/play` runs
  `ng test` (Karma + Chrome headless); it is not wired into CI and has not been
  verified. `packages/cordova`'s `test` script is a no-op `echo`.
- **`npm audit` reports 139 vulnerabilities** (8 critical, 83 high) across the
  dev toolchain — Angular 16, protractor, eslint 8 and friends are all past
  end-of-life. None are fixable without major upgrades.
- **Deprecated toolchain.** `jasmine-ts` (0.4.0, unmaintained), `protractor`
  (EOL), `core-js` 2, TypeScript 4.9. Upgrading is a project in itself and is
  tracked in [RYUU_PROGRESS.md](./RYUU_PROGRESS.md).

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every push to
`master`, every pull request, and on demand. Two jobs, both on the pinned Node
version from `.nvmrc`:

- **backend** — scoped `npm ci`, then lint/test/compile for common, sets,
  simple-bot and server in dependency order.
- **play** — scoped `npm ci`, compile common, then lint and `ng build` for the
  Angular app.
