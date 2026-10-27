# Ryuu-play progress log

Running log of automated work on this fork. Newest entry first.

---

## 2026-10-27 — Black & White specced (45 of 45 cards)

First slice of the per-set split agreed on 2026-10-24. BW is the smallest of
the three Standard sets, so it went first.

### Delivered

Specs for all 43 BW cards that had none, joining the 2 that already did:

- **Pokemon (14):** Tepig, Piplup, Tynamo NV, Tynamo DEX, Durant, Prinplup,
  Reshiram, Rayquaza DRV, Rayquaza EX, Terrakion, Pignite, Emboar, Emolga,
  Empoleon, Shuckle.
- **Special Energy (3):** Prism, Rainbow, Rescue.
- **Trainers (25):** Bianca, Cheren, Colress, Computer Search, Crushing
  Hammer, Dowsing Machine, Energy Retrieval, Enhanced Hammer, Exp Share,
  Level Ball, Max Potion, PlusPower, Pokegear 3.0, Pokemon Catcher, Pokemon
  Communication, Professor Juniper, Professor Oak's New Theory, Quick Ball,
  Rare Candy, Revive, Skyarrow Bridge, Super Rod, Switch, Tool Scrapper,
  Ultra Ball.

**No card bugs found.** Every spec passes against the code as written, so
unlike the Ruby & Sapphire / Sandstorm run there is no follow-up fix PR. That
is a result worth recording, not an absence of work: these cards were already
correct.

### Tests

sets 2502 -> **2673** (+171), 0 pending. common 350, simple-bot 44, server 35.
All passing, lint and compile clean.

Card coverage: BW 2/45 -> **45/45**. Repo-wide 541 -> **584 of 861** (62.8% ->
67.8%).

### Notes for the next run

- **Per-set split works.** Each batch was committed and pushed as it went, so
  a spend-limit cutoff would have cost one batch, not the set.
- **BW2 is 81 cards**, close to Ruby & Sapphire (96) and Sandstorm (100),
  which each took a full run and turned up 30 bugs between them. Expect BW2 to
  need more than one run, or splitting again; BW3 (53) should fit in one.
- Engine behaviours worth knowing when writing specs, all learned the hard way
  here: played Supporters go to `player.supporter`, not the discard pile; a
  Knock Out leaves both a promotion prompt and the opponent's prize prompt
  pending; promoting a Benched Pokemon swaps the slot objects, so hold a
  reference to the slot rather than indexing `bench[0]` afterwards;
  `energyPlayedTurn` and `stadiumUsedTurn` both default to 0 and collide with
  turn 0, so set them to -1 to test the card rather than the once-per-turn
  guard.

---

## 2026-10-24 — Three rules questions settled from primary sources

All three open rules questions from 2026-10-23 were resolved against the
Pokemon Rulings Compendium rather than secondhand quotes, and the 7 pending
specs are now active. Sets: 2492 running + 7 pending -> 2502 running, 0 pending.

### 1. Mirror Move copies the Special Condition — card was wrong

Confirmed, with primary sources:

> Q. Can Spearow's Mirror Move poison the opponent if (let's say) the final result of the last attack was
> 30 damage and poison? **A. Yup! It would do 30 damage and Poison.** (May 4, 2000 WotC Chat, Q28)

> "If the attack also has a special condition, you would do that back as well (like poison)."
> (Feb 7, 2002 WotC Chat, Q300 & Q302; Feb 14, 2002 WotC Chat, Q12, Q18, Q39)

The "errata" the helper cited was not an errata. The text quoted in its comment
is the printed wording of the **later Pidgeot reprint** (DP:Secret Wonders
onwards), a different card, and the 2016 TPCi ruling about not copying effects
attaches to that card. Neither reprint exists in this package, so only the WotC
rulings ever applied here.

`mirrorMove` now takes the printed wording — `'final result'` (Pidgeotto BS,
Spearow JU) or `'damage only'` (the later reprints, unused so far) — so adding
a reprint later will not change how the originals behave. The two wordings
genuinely differ; that is the card, not an inconsistency.

### 2. Mirror Move also ignored Bench damage — second bug, same ruling set

> Q. If an opponent's attack damages my benched Pidgeotto, can Pidgeotto then do "Mirror Move" during my
> next turn and attack for the amount of damage it received while on the bench? **A. Yes.**
> (May 23, 2002 WotC Chat, Q273)

The helper bailed out unless the damaged Pokemon was Active. Fixed, and the
end-of-turn marker cleanup now covers the Bench too, so the markers it records
there cannot leak into a later turn.

Two behaviours checked and deliberately left alone, both already correct:
Weakness/Resistance is baked into the recorded number (the pipeline is
`DealDamage -> ApplyWeakness -> PutDamage -> AfterDamage`), and placed damage
counters correctly do not register, because `PutCountersEffect` never
dispatches `AfterDamageEffect`.

### 3. Camerupt / Slaking "does nothing" — cards were wrong

> Q. "If tails, that attack does nothing". Does this mean that the attack cannot be made or that the attack
> can be made but neither damage nor effects can happen?
> **A. The attack will be made, but damage and effects don't happen.** (Oct 19, 2000 WotC Chat, Q185)

Both threw `NOT_ENOUGH_ENERGY`, making the attack unusable. They were the only
2 of the 33 cards whose text says "this attack does nothing" to do that; the
rest already followed the ruling. Now they resolve and do nothing.

"Effects don't happen" covers the drawback, so Slaking is **not** locked out of
attacking next turn when Critical Move does nothing. Covered by a spec.

### 4. Illumise / Lunatone / Solrock "in play" — cards were already right

> Q. Lunatone's "Lunar Eclipse" power says "If Solrock is in play..." Does this count for ANY Solrock
> (yours or opponent's) or only your own? **A. No. There was an error in translation that left it vague -
> a player must have both of them in play on their side, to use those Poke-Powers.**
> (Sep 26, 2003 PUI Rules Team)

Identical rulings exist for Solrock/Lunatone and Illumise/Volbeat. Own side
only — the usual "in play means either side" reading does not apply, because
the wording is an acknowledged translation error. **No behaviour change.** The
three pending specs asserted the opposite, so they were inverted rather than
enabled.

One readability trap fixed while here: `Player.forEachPokemon(playerType, ...)`
only ever iterates **that player's own** Pokemon — the `PlayerType` argument
just labels the `CardTarget` it builds. Illumise called it on a variable named
`opponent` that was actually its own controller, which read like a bug and
would eventually have been "fixed" into one. Renamed, and all three cards now
carry the ruling in a comment.

### Tests

common 350, sets 2502 (0 pending), simple-bot 44, server 35 — all passing.

### Still open

- The org monthly API spend limit still blocks the next unattended run. Needs
  an admin to raise it; nothing in this repo can work around it.
- BW / BW2 / BW3 specs (45 / 81 / 53 cards) remain the next body of work.
  Worth splitting per set so a mid-run limit costs one set, not all three.

---

## 2026-10-23 — 43 card bugs fixed, Ruby & Sapphire / Sandstorm specced

### Delivered (PRs)

- **#13** (from 2026-10-22) Jungle + Team Rocket specs: merged master in, regenerated SET_COVERAGE, merged.
- **#16** fixed 21 of the 23 pending specs from #13, after checking each printed card.
  - **Engine:** new `ConfusionDamageEffect`, so cards can change or prevent confusion self-damage.
  - **Engine:** `DealDamageEffect.source` now reaches `ApplyWeaknessEffect`, so damage from a non-Active Pokémon checks Weakness against the right Pokémon.
  - **Engine:** new `GameMessage.CANNOT_USE_ATTACK`.
  - **Cards:** Digger, Challenge!, Dark Gyarados, Dugtrio, Persian, Rapidash, Primeape, Golbat, Dragonair, Machoke, Machamp (TR); Venomoth and Vileplume (JU).
  - common 350 specs.
- **#17** specs for Ruby & Sapphire (96 cards) and Sandstorm (100 cards), +886 specs. Cards with a spec: 345 → 541 of 861.
- **#18** fixed 30 card bugs those specs found.
  - **Ruby & Sapphire:** Beautifly, Cascoon, Silcoon, Gardevoir, Pelipper, Ralts, Skitty, Slaking, Swampert, Swellow, Wailmer.
  - **Sandstorm:** Azurill, Baltoy, Cradily, Dunsparce, Kecleon, Linoone, Shroomish, Typhlosion ex, Rare Candy, Wally's Training.
  - **Rain Dish double heal:** Lotad, Lombre, Ludicolo, Root Fossil.
- **Tests:** common 350, sets 2499 (7 pending), simple-bot 44, bot-bench 30, server 35, all passing. Bench smoke: 0 rejected actions.

### Open rules questions (pending specs, owner to decide)

- **Mirror Move (Pidgeotto BS, Spearow JU):** WotC chat answers (2000–2002, quoted secondhand) say it also copies a Special Condition the attack actually applied.
- **Camerupt RS Fire Spin / Slaking RS Critical Move:** without enough basic Energy, is the attack unusable (current behaviour) or does it "do nothing"?
- **Illumise / Lunatone / Solrock SS:** "if X is in play": should the opponent's X count?

### Process note

This run stopped early: it hit the org's monthly API spend limit while BW / BW2 / BW3 spec agents were starting. Nothing from those agents was kept.

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
- ~~Noticed: the sidebar stays open on phone widths and takes half the screen.~~ Fixed 2026-10-26: below 768 px the sidebar is an overlay menu (closed by default, opened from the RyuuPlay button, closes after choosing a link). Desktop unchanged.

---

## 2026-10-22 — Engine targeting fix, 1,000+ card specs, card bug fixes

**Goal:** close the engine issues noted on 2026-10-21, then give the base-era
sets behavioural evidence (only 1 Base Set card and 0 Fossil cards had specs).

### Delivered (PRs)

- **#9** (from 2026-10-21) audit spec fix — master was red; merged by the owner.
- **#10** play-card: Energy, Pokémon and Tools can no longer be played onto the
  opponent's side (`TOP_PLAYER`/`ANY` targets threw nothing before). Fixed the
  always-true `isEvolved` expression. common 333 → 337.
- **#11** specs for every Base Set and Fossil card (+583). **Audit fix:** Jungle,
  Fossil and Team Rocket print every holo twice; the "16/16/17 missing cards"
  roadmap item was that double count. Jungle and Team Rocket are complete;
  Fossil lacks only Ditto.
- **#12** six card fixes found by those specs: Maintenance BS, Blastoise BS Rain
  Dance (+ `AttachEnergyPrompt.validate` now enforces `blockedTo`), Alakazam BS
  Damage Swap, Electrode BS Buzzap (KO/Prize now processed; `checkState`
  exported), Gastly FO, Slowpoke FO.
- **Jungle + Team Rocket specs** (this PR): Jungle all 43 non-vanilla cards
  (+221); Team Rocket 46 files (+269) — the TR batch was cut short by an API
  spend limit and its 18 pending specs are suspected bugs not yet reviewed.

Cards with a spec: 124 → 344 of 861.

### Known card bugs (pending `xit` specs, not yet fixed)

- Pidgeotto BS / Spearow JU Mirror Move copy damage only (ruling uncertain).
  (Haunter FO, Muk FO and Sableye SF were fixed in #14.)
- Venomoth JU Shift: no once-per-turn marker; changes the Active instead of
  Venomoth when benched. Vileplume JU Heal: once-per-turn marker shared by all
  Vileplume. Text typos in Victreebel JU Acid / Persian JU Pounce ("your next
  turn" should be "your opponent's next turn"; behaviour is right).
- Team Rocket: 18 pending specs (Digger, Challenge!, Dark Gyarados Final Beam,
  Dark Dugtrio, Dark Persian, Dark Rapidash, Dark Primeape, Dark Golbat,
  Dark Dragonair, Dark Machoke, Dark Machamp) — verify each against the printed
  card before fixing.

### Process note

Self-merging via the API is still refused by the session permission classifier
("Merge Without Review"); the owner merged #9–#11 during the run.

---

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

1. **Specs for the Standard folders**: BW (45), BW2 (81), BW3 (53) and the
   rest have ~0 specs; past rounds found a bug in roughly 1 card in 6.
2. **Owner rulings** on the open rules questions in the 2026-10-23 entry.
3. **Ditto FO** (only missing base-era card); abort-draw rule; Sableye shuffle.
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
