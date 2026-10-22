# Ryuu-play progress log

Running log of automated work on this fork. Newest entry first.

---


## 2026-10-22 (interactive) — Known card bugs

- **Engine:** when a Pokémon uses a power, every other card now reacts to the `PowerEffect` before the
  power's own card (store.ts `propagateEffect`). Before, cards reacted in alphabetical order, so a power
  could act before a blocker checked it (Dragonite's Step In switched before Muk's Toxic Gas looked at
  Muk's Special Conditions). Ditto RG's "blocked" spec now reports `BLOCKED_BY_ABILITY`, the accurate reason.
- **Muk FO:** an Asleep/Confused/Paralyzed Active Muk no longer stops Dragonite's Step In (follows from the engine fix).
- **Haunter FO:** Transparency now also protects a Benched Haunter (coin flip; tails applies the effect).
- **Sableye SF:** Impersonate shuffles the deck before using the Supporter's effect.
- **Pidgeotto BS Mirror Move:** left as-is. Printed text says "final result of that attack"; the shared
  implementation copies damage only and cites an errata. Needs an official ruling; spec stays pending.
- `isEvolved` in play-pokemon-effect was already fixed on master.
- Still open: abort-game scores a DRAW when the player who quit is ahead on prizes.
  This is upstream's deliberate policy (aborts also cover timeouts and arbiter bans); left for the owner to decide.
- **Learn mode v1 — "How to play" page** (`packages/play/src/app/rules`, route `/rules`, sidebar link). Plain-language
  rules reference covering winning, setup and mulligans, turn order, Energy, evolving, retreating, damage/Weakness/
  Resistance, Special Conditions, Trainer types and beginner tips. Every rule stated was checked against what the
  engine enforces (e.g. first player draws on turn 1, Burn = flip/tails 20, Confusion = tails 30 to itself).
  Verified with `ng lint`, `ng build` and headless screenshots at desktop and phone widths.
- Noticed: the sidebar stays open on phone widths and takes half the screen (pre-existing, whole app).

## 2026-10-21 — Reducer tests, bot benchmark, set audit, card fixes

**Goal:** the three top roadmap items (reducer coverage, bot benchmark, set
audit), then act on what the audit found.

### Delivered (PRs)

- **#4 common turn-flow reducer tests.** Line coverage: player-turn 11% → 100%,
  setup 15% → 99%, play-card 19% → 100%, abort-game 18% → 100%,
  player-state 18% → 96%; common overall 49.8% → 82.4%. common specs 243 → 333.
  Fixed `ReorderBenchAction` accepting an out-of-range `to` index (bench grew to
  8 slots with `undefined` holes).
- **#5 card/set coverage audit.** `npm run audit:sets -w packages/sets`
  regenerates [SET_COVERAGE.md](./SET_COVERAGE.md). 861 cards: 800 implemented,
  59 vanilla, 1 partial, 1 needs logic; only 120 (13.9%) have specs.
- **#6 bot-vs-bot benchmark** (`packages/bot-bench`, see
  [BOT_BENCHMARK.md](./BOT_BENCHMARK.md)). Seeded, deterministic, loop-guarded;
  CI runs a 21-game smoke. Baseline over 588 games: no errors, stalls or guard
  hits; avg ~26 turns; first player wins ~55%; BW decks win 80–90% vs Base Set
  decks; ~half of games end by bench-out.
- **#7 card bug fixes:** Potion BS (did nothing), Rotom OP9 (bonus never
  applied), Oddish UND (missing coin flip), PokeDex HANDY909 RG and Evosoda XY
  (missing shuffle). sets specs 516 → 525 (before #5's +10).
- This doc update (BUILD.md now includes bot-bench).

### Engine issues noted, not changed

- play-card lets `TOP_PLAYER`/`ANY` targets resolve to the opponent for every
  card type (own energy/basics onto the opponent's side).
- `play-pokemon-effect.ts`: `isEvolved = stage === STAGE_1 || Stage.STAGE_2` is
  always true (harmless today; the stage comparison still blocks bad evolutions).
- abort-game: if the culprit is ahead on prizes the result is DRAW. Pinned by
  specs as current behaviour; intent unverified.
- Sableye SF Impersonate does not shuffle after searching (needs restructuring).

### Process note

The scheduled run could push and open PRs, but self-merging and the Gmail report
were refused by the session's permission classifier ("Merge Without Review",
"External System Writes"). Unless the scheduled task is set to auto-approve,
future runs will leave green PRs for the owner to merge.

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

### Next up

1. **Missing cards in partial sets** (from SET_COVERAGE.md): Fossil 16 missing
   (Ditto FO is written but commented out over passive-Ability copying),
   Jungle 16, Team Rocket 17. Card text must match the real card.
2. **Specs for unspecced sets**: Base, Ruby & Sapphire, Sandstorm have zero
   specs; FireRed & LeafGreen is the only fully specced set.
3. **Engine issues listed in the 2026-10-21 entry** (opponent-side targeting in
   play-card, `isEvolved` expression, abort-draw rule, Sableye shuffle).
4. **Bot quality** now that the benchmark exists: a balanced deck pool first
   (BW decks dominate), then prize-trade / bench-management heuristics measured
   against the baseline.

### Tooling and infrastructure

- **Make root `npm ci` work.** Replace the plain-HTTP
  `cordova-plugin-statusbar-patched` tarball (needs an Android build to verify).
- **Wire up `packages/play` tests** (Karma headless + CI job).
- **Dependency backlog**: 139 `npm audit` findings; drop protractor, then
  eslint 9, then Angular 17 → 18 → 19.
- **Replace `jasmine-ts`** (unmaintained; blocks TypeScript 5).
- **Coverage reporting / floor in CI** (common is now 82% lines).
- Optionally gate CI on `npm run audit:sets -- --check`.

### Engine rules

- **Prompt coverage**: attach-energy, choose-attack, put-damage, move-energy,
  order-cards prompts still ~12–20%.
- **Edge-case rules**: special conditions stacking, Pokémon-ex/V rules,
  ability lock interactions, deck-out and sudden-death.

### Web UI (`packages/play`)

- Karma tests (see tooling); bundle size (8.70 MB initial); Angular upgrade.
