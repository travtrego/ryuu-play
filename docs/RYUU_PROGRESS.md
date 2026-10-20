# Ryuu-play progress log

Running log of automated work on this fork. Newest entry first.

---

## 2026-10-20 — Install / build / test baseline + CI

**Goal:** get a clean, repeatable install → build → test baseline so daily
automated runs have something to stand on.

### What was found

The repo was in better shape than expected: **no source, config or test
changes were needed**. Every package lints, tests and compiles clean. The only
thing standing between a fresh clone and a green run was the install step.

`npm ci` at the repo root fails:

```
npm error code E405
npm error 405 Method Not Allowed - GET http://dev.ryuu.eu/distfiles/cordova-plugin-statusbar-patched-2.4.3.tar.gz
```

`packages/cordova` dev-depends on a tarball served over **plain HTTP from a
third-party host**, not the npm registry. The host is alive, but any
environment that cannot issue plain-HTTP requests — HTTPS-only proxies,
sandboxed CI — fails the install, and because it is a workspace, the whole
root `npm ci` fails with it. Nothing else in the monorepo can be installed
until that one Android-only dependency resolves.

Fix: scope the install to the five packages that are actually buildable here.
Cordova needs the Android SDK anyway, so it was already out of scope.

### Node version

Pinned **18.20.8** in `.nvmrc`. No package declares `engines`; the binding
constraint is Angular 16 + nyc 17 → **Node >= 18.10**, and every package
dev-depends on `@types/node@^18`, so Node 18 keeps compile-time types and
runtime in agreement. Node 22.22.0 was also verified green end to end,
including `ng build` — the pin is for reproducibility, not necessity.

### Baseline results

| Package    | lint | test                      | compile |
| ---------- | ---- | ------------------------- | ------- |
| common     | pass | **243 specs, 0 failures** | pass    |
| sets       | pass | **516 specs, 0 failures** | pass    |
| simple-bot | pass | **44 specs, 0 failures**  | pass    |
| server     | pass | **35 specs, 0 failures**  | pass    |
| play       | pass | not run (`ng test`/Karma) | `ng build` pass, 8.70 MB |
| cordova    | skipped — needs Android SDK | | |

**838 specs, 0 failures.** No known failing tests. Full pipeline from clean
checkout ≈ 6 min (install ≈ 2.5 min).

### Delivered

- `.nvmrc` pinning Node 18.20.8
- `.github/workflows/ci.yml` — backend job (lint/test/compile for common, sets,
  simple-bot, server in dependency order) and play job (lint + `ng build`)
- `docs/BUILD.md` — commands, timings, known gaps
- this log

---

## Roadmap for future runs

Rough priority order. Each item is meant to be a self-contained day's work.

### Tooling and infrastructure

- **Make root `npm ci` work.** Replace the plain-HTTP
  `cordova-plugin-statusbar-patched` tarball with a registry-hosted
  equivalent, or vendor it. Needs an Android build to verify, so it is not a
  blind swap.
- **Wire up `packages/play` tests.** `ng test` runs Karma + Chrome; it needs a
  headless config and a CI job. Currently the web UI has no test signal at all.
- **Address the dependency backlog.** 139 `npm audit` findings (8 critical).
  Angular 16, eslint 8 and protractor are all EOL. Sensible order: drop
  protractor (dead, unused), then eslint 9, then Angular 17 → 18 → 19.
- **Replace `jasmine-ts`.** Unmaintained at 0.4.0 and the reason test runs need
  `ts-node`. Moving to `ts-node/esm` + plain jasmine, or to vitest, would
  speed up the suite and unblock a TypeScript 5 upgrade.
- **Add coverage reporting to CI.** `nyc` already runs; nothing collects the
  output. A coverage floor would stop silent regressions.

### Cards and sets

- **Coverage audit.** Enumerate which real-world sets are implemented in
  `packages/sets` and which are stubs, and publish the list. Without it there
  is no way to size the gap.
- **Fill in missing cards** set by set, each with specs in the existing
  `tests/**/*.spec.ts` style. This is the most parallelisable work in the repo
  and the best fit for daily automated runs.
- **Card-text conformance tests** — a harness that checks implemented effects
  against printed card text, to catch silent rule drift.

### Engine rules

- **Raise `packages/common` coverage.** The reducers are the weak spot:
  `player-turn-reducer` ~11%, `setup-reducer` ~14%, `play-card-reducer` ~19%,
  `abort-game-reducer` ~18%. These are the core turn-flow rules and are
  effectively untested.
- **Prompt coverage.** Several prompts sit near 12-20%
  (`attach-energy-prompt`, `choose-attack-prompt`, `put-damage-prompt`,
  `move-energy-prompt`, `order-cards-prompt`).
- **Edge-case rules**: special conditions stacking, Pokémon-ex/V rules,
  ability lock interactions, deck-out and sudden-death.

### AI bot

- **Benchmark `simple-bot`.** 44 specs today and no measure of how well it
  actually plays. A bot-vs-bot harness producing win rates and average game
  length would turn AI work into something measurable.
- **Improve play quality** once that baseline exists — currently the bot does
  not model prize trade, energy attachment planning or bench management.
- **Game-length / determinism guards** so AI changes cannot silently cause
  infinite loops in CI.

### Web UI (`packages/play`)

- Get Karma tests running (see tooling).
- **Bundle size**: 8.70 MB initial, 6.68 MB of it vendor. Lazy-loaded routes
  and dropping `core-js` 2 would cut this substantially.
- Angular upgrade path, tracked with the dependency backlog above.
