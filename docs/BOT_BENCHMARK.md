# Bot benchmark (`packages/bot-bench`)

A headless harness that plays complete Pokémon TCG games between two
`SimpleBot` instances (or two bot variants) using real 60-card decks of cards
implemented in `packages/sets`, and reports win rates, game lengths and every
failure mode it can detect. Same seed, same games.

## Where it lives and why

`packages/bot-bench` is a small private workspace package
(`@ptcg/bot-bench`) depending on `@ptcg/common`, `@ptcg/sets` and
`@ptcg/simple-bot`.

`simple-bot` itself does not depend on `sets`, and the bot should stay
card-agnostic. Putting the harness in its own package keeps `sets` out of
simple-bot's dependency graph and keeps benchmark code out of simple-bot's
published `dist/`. Build order is `common -> sets -> simple-bot -> bot-bench`.

## Install and build

The scoped install gains one workspace:

```bash
npm ci --include-workspace-root \
  -w packages/common \
  -w packages/sets \
  -w packages/simple-bot \
  -w packages/bot-bench \
  -w packages/server \
  -w packages/play
```

The old command without `-w packages/bot-bench` still works. It just doesn't
install bot-bench's devDependencies, which are the same versions every other
package already uses.

```bash
npm run compile -w packages/common
npm run compile -w packages/sets
npm run compile -w packages/simple-bot

npm run lint    -w packages/bot-bench
npm run test    -w packages/bot-bench   # 30 jasmine specs, ~15 s
npm run compile -w packages/bot-bench
```

## Running a benchmark

```bash
# 200 games, seed 1, summary table on stdout (compiles first)
npm run bench -w packages/bot-bench -- --games 200 --seed 1

# also write summary + per-game results as JSON
npm run bench -w packages/bot-bench -- --games 200 --seed 1 --json bench.json

# JSON only, to stdout
npm run bench -w packages/bot-bench -- --games 50 --json

# compare two bot variants, restricted deck pool, live progress on stderr
npm run bench -w packages/bot-bench -- --games 84 --bot-a default --bot-b no-retreat \
  --decks bs-fire,bs-water,bw-zekrom --progress

# replay single games of a run (same seed => identical game), e.g. to debug one
npm run bench -w packages/bot-bench -- --seed 1 --only 75 --progress

# CI smoke (what .github/workflows/ci.yml runs)
npm run bench:smoke -w packages/bot-bench
```

All options (`node packages/bot-bench/dist/cli.js --help`):

| option | default | meaning |
| --- | --- | --- |
| `--games N` | 100 | games to play |
| `--seed S` | 1 | run seed. Game *i* uses `deriveSeed(S, i)` |
| `--bot-a`, `--bot-b` | `default` | bot variants: `default`, `no-retreat`, `no-trainers` |
| `--decks a,b,...` | all 7 | deck pool |
| `--only i,j` | | play only these game indexes of the run |
| `--max-turns N` | 200 | loop guard: abort once `state.turn > N` |
| `--max-actions N` | 5000 | loop guard: bot actions per game |
| `--max-actions-per-turn N` | 250 | loop guard: bot actions within one turn |
| `--json [FILE]` | | summary + per-game JSON (stdout if no file) |
| `--progress` | | one line per game on stderr |
| `--max-errors N`, `--max-guard-aborts N`, `--max-stalled N`, `--max-illegal-moves N` | | exit 1 if more than N games end that way |

Exit codes: `0` ok, `1` a `--max-*` threshold was exceeded, `2` bad arguments.

## How a game is driven

`playGame()` in `src/headless-game.ts` copies what the server does for bot
games (`Core.createGame`, `Game.dispatch`/`handleArbiterPrompts`,
`BotGameHandler.onStateChange`), but runs synchronously, with no network, DB,
timers or `config.bots.actionDelay`:

1. A `Store` is created with default `Rules` (unlimited format; the first
   player may attack on turn 1). Both decks are added with `AddPlayerAction`.
   The server adds the second player with `InvitePlayerAction` + `InvitePlayerPrompt`,
   which SimpleBot answers with the same deck, so the result is the same.
2. Loop:
   - Any pending `ShuffleDeckPrompt`/`CoinFlipPrompt` is resolved by
     `SeededArbiter`. It has the same semantics as the server's `Arbiter`
     (uniform Fisher-Yates, fair coin, same flip log line) but uses a seeded
     mulberry32 PRNG instead of `Math.random()`.
   - Otherwise each bot, seat 0 first, is asked `decodeNextAction(state)`
     with the full state, exactly as the server passes it. The first action
     returned is dispatched.
   - If a `GameError` rejects an action, that is a *rejected action* (invalid
     move). As in `Game.updateInvalidMoves`, more than 15 consecutive
     rejections from one player dispatch
     `AbortGameAction(ILLEGAL_MOVES)` → outcome `illegal-moves`.
   - Any other exception, from the engine or the bot → outcome `error`, with
     message, stack, turn, phase, action and side recorded.
   - If no bot returns an action and no arbiter prompt is pending → `stalled`.
     The server would wait forever in this case; the harness records it and
     moves on.
   - The loop guard (turns, actions, actions per turn) is checked between
     actions → `guard`.

Determinism: the harness never calls `Math.random()`, and a spec asserts this
for a whole game. `SimpleBot`'s own look-ahead arbiter defaults to
`ALL_HEADS`/`NO_SHUFFLE`, which is deterministic. Bot variants that set
`BotFlipMode.RANDOM` or `BotShuffleMode.RANDOM` are rejected, because those
modes call `Math.random()` inside the engine's `BotArbiter`. The engine was
not changed for any of this. Bots are created fresh for every game.

The guard runs *between* actions. It cannot interrupt an infinite loop inside
one synchronous `Store.dispatch` or `decodeNextAction` call. None has been
observed.

## Decks

`src/decks.ts` lists seven decks. Each is valid according to `DeckAnalyser`,
and a spec checks this. They are purpose-built lists, not official theme decks.

| deck | contents |
| --- | --- |
| `bs-fire` | Base Set Charizard / Arcanine / Ninetales / Magmar |
| `bs-water` | Base Set Blastoise / Poliwrath / Starmie / Dewgong |
| `bs-lightning` | Base Set Raichu / Magneton / Electrode / Zapdos |
| `bs-fighting` | Base Set Machamp / Dugtrio / Onix / Hitmonchan |
| `bs-psychic` | Base Set Alakazam / Haunter / Mewtwo / Jynx |
| `bw-emboar` | BW-era Emboar LTR / Reshiram, Juniper, Ultra Ball, Rare Candy |
| `bw-zekrom` | BW-era Eelektrik NV / Zekrom / Emolga, Juniper, Ultra Ball |

The BW decks use Base Set basic energy. The `Standard` format in `init.js` has
no basic energy cards, so these two decks are only legal under unlimited
rules, which the harness uses.

## Scheduling

With P unordered deck pairs (21 for 7 decks):

- games `0..P-1` play each pair once, a full round robin;
- games `P..2P-1` play the same pairs with decks swapped between sides;
- the next games repeat the cycle;
- seats (`state.players[0]`) alternate every game.

Over any multiple of `2P` games, each pair is therefore played with both deck
assignments and both seat orders. To get balanced deck statistics, use a
multiple of 42 games, for example 42, 84 or 210.

## Metrics

- **outcomes**:
  - `win`, `draw`, `no-winner` (finished with `GameWinner.NONE`);
  - `guard` (with reason `max-turns` / `max-actions` / `max-actions-per-turn`);
  - `stalled`, `illegal-moves`, `error`.
- **end reasons** of finished games, taken from the engine's end-of-game log lines:
  - `prizes`: a player took their last prize;
  - `no-active`: a player had no Pokémon left to promote;
  - `deck-out`: a player could not draw.

  A game can have two reasons, for example a KO that takes the last prize and
  also leaves the opponent with no Pokémon.
- **win rate per side** (A/B), **per deck** (every game the deck played, on
  either side), **per ordered matchup** (JSON), and **went first** (win rate of
  the player who took turn 1, among decided games). Win rates use all games as
  the denominator. Games without a winner are counted under "no result".
- **game length**: turns (`state.turn` at the end) and bot actions, as avg/min/max.
- **rejected bot actions**: count and a histogram of `Action: GameError message`.
- **unexpected errors**: every non-`GameError` exception, with game index and seed.
- **problem games**: index, seed and detail for every game that did not end
  in a win or draw.
- `durationMs` per game and per run. This is the only field that is not
  deterministic.

## CI

`.github/workflows/ci.yml`:

- the backend job installs `packages/bot-bench`;
- it runs bot-bench lint/test/compile after simple-bot;
- after server, it runs `npm run bench:smoke -w packages/bot-bench`. That is
  21 games with seed 1, one full round robin, about 26 s locally. The step
  fails if any game ends as `error`, `guard`, `stalled` or `illegal-moves`
  (all thresholds are 0).

Because the run is deterministic, a CI failure reproduces locally with the
same command. `--only <index> --progress` isolates the failing game.

## Baseline (2026-10-21)

Measured on Node 22.22.0 with 2 vCPUs. "default" is `new SimpleBot(name)`
with no options, the same bot the server registers in `init.js`.

### Mirror: default vs default, 210 games, seed 1

```
outcome        games
win              209
draw               1
no-winner/guard/stalled/illegal-moves/error: 0
end reasons: no-active=107, prizes=103, deck-out=12

side         games  wins  losses  no result  win rate
A (default)    210   119      90          1     56.7%
B (default)    210    90     119          1     42.9%
went first     209   124      85          0     59.3%

deck          games  wins  losses  no result  win rate
bs-fighting      60    20      40          0     33.3%
bs-fire          60    20      40          0     33.3%
bs-lightning     60    21      38          1     35.0%
bs-psychic       60    21      38          1     35.0%
bs-water         60    22      38          0     36.7%
bw-emboar        60    52       8          0     86.7%
bw-zekrom        60    53       7          0     88.3%

              avg  min  max
turns        26.3    1   74
bot actions  92.9    5  201

rejected bot actions (GameError): 0
unexpected errors: 0
```

### Mirror: default vs default, 210 games, seed 2

- 210 wins, 0 draws, 0 errors / guard / stalled / illegal-moves, 0 rejected actions.
- A 52.9% / B 47.1%. Went first 51.4%.
- turns avg 25.7 (min 3, max 79); actions avg 94.0 (min 13, max 214).
- end reasons: no-active=112, prizes=101, deck-out=13.
- Decks: bs-fighting 33.3%, bs-fire 38.3%, bs-lightning 35.0%,
  bs-psychic 26.7%, bs-water 45.0%, bw-emboar 80.0%, bw-zekrom 91.7%.
- 255.9 s wall clock, about 1.2 s/game single-threaded.

### Variant comparisons (84 games each = 2 full cycles)

| A | B | seed | A win rate | B win rate | notes |
| --- | --- | --- | --- | --- | --- |
| default | no-retreat | 2 | 58.3% (49) | 41.7% (35) | 0 errors/guard/stalled |
| default | no-trainers | 3 | 65.5% (55) | 34.5% (29) | 0 errors/guard/stalled; games shorter (23.3 turns, 72 actions avg) |

Both variants lose to the default bot. The harness picks up changes in bot
strength at this sample size. The no-trainers gap is clear. The no-retreat gap
is about 1.5σ at 84 games, so run more games before trusting it.

### Timing

Across the 420 mirror games, per-game wall clock was:

- median 0.9 s;
- p95 5.0 s;
- max 9.9 s.

21 games took more than 5 s. They are all long (37-79 turns) and 17 of them
involve `bs-psychic`. 13 ended by prizes and 8 by deck-out. Almost all CPU
time goes to SimpleBot decisions. Every
candidate tactic is validated with a `Simulator`, which deep-clones the state.

## Observed issues and findings

1. **No crashes, hangs or rejected actions in 588 games.** The 588 are 2 × 210
   mirror games and 2 × 84 variant games. None ended as `error`, `guard`,
   `stalled` or `illegal-moves`, and the bots sent 0 actions that the engine
   rejected. SimpleTacticsAi tries every turn action in a `Simulator` before
   returning it, and every prompt answer was accepted. With these 7 decks, the
   default loop-guard limits were never close: the longest game had 79 turns
   and 214 actions, against limits of 200 and 5000.
2. **The deck pool is heavily unbalanced.** The two BW-era decks win 80-92% of
   their games against the Base Set decks. Per-deck win rates mostly measure
   card power, not bot skill. To evaluate the bot, compare *variants* on the
   same pool, or restrict `--decks` to one era.
3. **About half of all games end by bench-out.** `no-active` appears in 219 of
   420 mirror games, `prizes` in 204 and `deck-out` in 25. Three games ended on
   turn 1, all with `bs-fighting` going first and knocking out a lone starting
   Pokémon. The default `Rules` allow an attack on turn 1, and SimpleBot does
   put every basic it can on the bench at setup
   (`ChooseCardsPromptResolver` takes up to 6). This is a real property of the
   decks and rules, not a harness artifact. Still, it is a fair target if bot
   play is to look human: for example, keep a backup basic in play before
   using draw Supporters such as Professor Oak / Juniper, which discard the hand.
4. **Going first wins 55.4%.** That is 232 of 419 decided mirror games: 59.3%
   with seed 1 and 51.4% with seed 2.
5. **Side A vs side B in mirrors: 54.9% / 45.1%.** That is 230 vs 189 over 419
   decided games, about 2σ. Both sides run the same bot, and seats and deck
   assignments are balanced by the schedule. I checked that swapping the player
   names leaves results unchanged in 12 of 12 games. No mechanism was found, so
   this is treated as noise. Expect ±5 points of noise on 200-game runs.
6. **Draw case seen once.** Seed 1, game 75, `bs-psychic` vs `bs-lightning`:
   both players reached 0 prizes in the same check (`GameWinner.DRAW`). The
   engine handled it correctly.
7. **Determinism scope.** Determinism is guaranteed for a given Node/ICU
   build. `Store.propagateEffect` sorts cards with `String.localeCompare`, and
   that can in principle differ between ICU versions for accented names
   (`Pokémon …`). CI uses Node 18.20.8 (`.nvmrc`). The numbers above were
   measured on Node 22.22.0. The smoke benchmark's thresholds don't depend on
   exact game outcomes, so a difference here would change the numbers but not
   pass/fail.
