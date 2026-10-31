# Ryuu-play progress log

Running log of automated work on this fork. Newest entry first.

---

## Next up / Blocked on

Rewrite this block each run. It is what a self-directing run should read first;
the entries below are the record of what happened, not what to do.

1. **Guided game, in-game half.** The guided game (2026-10-31) gives fixed
   decks but the table does not know it is a guided game: the Tips panel shows
   the same situation tips as any game. Next: mark the game as guided (a flag
   the client can read from the state or game info) and show a short
   step-by-step script for turns 1-3 ("put Charmander active", "attach Fire
   Energy", "attack with Scratch"), falling back to the normal tips.
2. **Prompt answers still have no "Why?"** (targets, searched cards, discards).
3. **Cards: BW2 (79 left) and BW3 (53 left).** Fallback work; confirming
   correctness more than finding bugs now.
4. **Hosting: waiting on the owner, and now has a doc.** `docs/HOSTING.md`
   (2026-10-31) compares the options with exact steps. The owner picks; do not
   deploy anything or create accounts. The earlier version of this block said
   "Hosting (docs/HOSTING.md) waits on an owner decision" before that file
   existed, which read as a pointer to a document that was not in the repo.
   Only cite a path once it is committed.
5. Housekeeping: branch `claude/ryuu-access-check` is left over from a push
   check and is safe to delete.

---

## 2026-10-31 (later) — Hosting options written up (docs/HOSTING.md)

Priority 3 of the daily run has been "hosting waits on an owner decision
(free/local vs. a small paid host); you may write docs/HOSTING.md comparing
options". That doc now exists. Nothing was deployed and no account or service
was created.

### The finding that shapes the answer: SQLite works

`config.storage` defaults to MySQL, but `Storage.connect()` spreads that config
straight into TypeORM with `synchronize: true`, and **`sqlite3` is already a
production dependency of `packages/server`**. So the switch is config, not code.

Verified on Node 18.20.8: the server started with
`config.storage = { type: 'sqlite', database: ... }`, created `ptcg.sq3`,
synchronized all seven tables (`avatar`, `conversation`, `deck`, `match`,
`message`, `replay`, `user`) and answered HTTP on its port.

Not verified: a full game through the UI on SQLite, concurrent websocket load,
or the long-running scheduler tasks.

This matters because it removes the database server from the free option: no
MySQL to install, run, back up or secure. For one player and a bot, running on
your own machine is genuinely the whole answer.

### What the doc says

- **What the app needs**, measured from the repo: Node 18.20.8, one long-lived
  process serving API + websockets + UI on one port, a persistent disk, and CPU
  for the in-process bot.
- **Static and serverless hosts cannot run the server** (no long-lived process,
  no websockets, no disk). They could serve `packages/play` alone, but the
  Docker image already serves both halves.
- **The build is much heavier than the run**, so on a small host build the image
  elsewhere and ship it.
- **Option A, your own machine, free**: A1 Docker (`docker compose up --build`,
  overriding `REPO`/`TAG` because `docker/Dockerfile` defaults to upstream
  `keeshii/ryuu-play`), A2 straight from the checkout, A3 a tunnel if you want
  it reachable.
- **Option B, a small paid host**: what to look for in priority order
  (persistent volume, websockets, no forced sleep, 1 vCPU / 1 GB floor), the
  shape of each class of host, and the deployment steps including that
  `EXTERNAL_URL` is baked into the Angular bundle at build time.
- **Recommendation: start with A1 locally.** Costs nothing, reversible, fastest
  route to actually playing the bot, which is the point of the learn-mode work.
- A pre-public checklist: change `config.backend.secret` from `'!secret!'`,
  decide `registrationEnabled`/`serverPassword`, and note that
  `synchronize: true` alters the schema on boot.

### Known risk recorded, not hit here

`docker/Dockerfile` runs a plain `npm install` at the repo root, which pulls
`packages/cordova` and its `cordova-plugin-statusbar-patched` plain-HTTP tarball
(see `docs/BUILD.md`). On a network that blocks plain HTTP, or if that host is
down, the image build fails. The doc points at the no-Docker path as the way
round it.

---


## 2026-10-31 — Learn mode: a guided first game

The Games page has a new **Guided first game** button next to *Create game*.
One click starts a game against the bot with two ready-made beginner decks;
the player does not need a deck of their own (before, a brand-new player hit
"you need a deck" first). The game opens like any other bot game, with the
bot's "Why?" notes and the Tips panel.

### The decks

`packages/common/src/game/beginner-decks.ts`, Base Set cards only:

| | Pokémon (Basic → Stage 1) | Trainers | Energy |
| --- | --- | --- | --- |
| Player: **Beginner Fire** | Charmander 4 → Charmeleon 3, Growlithe 4 → Arcanine 2, Ponyta 4, Magmar 3 | Bill 4, Potion 4, Switch 2, PlusPower 2 | Fire 28 |
| Bot: **Beginner Lightning** | Pikachu 4 → Raichu 3, Rattata 4 → Raticate 3, Electabuzz 3, Voltorb 3 | same | Lightning 28 |

No Stage 2, no Pokémon Powers, four easy Trainers, and neither side is weak to
the other (Fire is weak to Water, Lightning/Colorless to Fighting), so the
first game is decided by play, not by Weakness. Bot vs bot on this matchup,
20 seeded games: 8-12, ~26 turns, 0 errors.

### How it works

- `server`: new socket call `core:createGuidedGame` →
  `createGuidedGame(core, client)` (`game/bots/guided-game.ts`) finds the
  first connected bot, and creates the game with the player's beginner deck,
  default settings and the bot invited. Fails with `ERROR_BOT_NOT_FOUND` when
  no bot is online.
- `Core.createGame` takes an optional `invitedDeck`, stored as
  `game.invitedDeck`; `BotClient` plays it instead of picking one of its
  saved decks. Normal games pass nothing and behave as before.
- `play`: `MainService.createGuidedGame()` and the button (with a tooltip);
  "no bot online" gets its own toast.

### Tests

- sets 2673 → **2684** (beginner decks: cards exist, legal 60, Basic/Stage 1
  only, no Powers, every Stage 1 has its Basic, easy Trainers + basic Energy,
  no Weakness to the other deck; the Weakness check was mutation-tested by
  swapping in Squirtle).
- bot-bench 32 → **38** (6 seeded full games of the guided matchup finish
  without errors).
- server 40 → **45** (guided game invites the bot with both decks, passes
  copies, errors without a bot; bot plays the preset deck and skips its saved
  decks; normal games still load a saved deck).
- play → **163 specs** (4 new GamesComponent specs: button renders, starts a
  guided game without the deck popup, the two error toasts). `ng lint` clean,
  `ng build` ok (8.78 MB).
- common 350, simple-bot 62 unchanged; bench smoke: 0 errors.

### Not verified

- A live guided game end to end (the server needs MySQL, not available here).
  The pieces are covered separately: server wiring by spec, the matchup by
  headless bot-vs-bot games, the button by Karma.
- The Games toolbar at phone width with two buttons was not checked in a
  browser.

---

## 2026-10-30 (later) — Learn mode: situation tips at the table, linked to /rules

A **Tips** panel now sits above the game log while you play. It shows at most
two short tips about your situation, each with a **Learn more** link that opens
the matching section of the "How to play" page in a new tab (the game stays on
screen). Examples:

> Your Charmander is Poisoned: it takes 10 damage between turns. Retreating or
> evolving it cures it. *Learn more*
>
> You haven't attached an Energy this turn. You can attach one Energy card from
> your hand, like Fire Energy, to one of your Pokémon. *Learn more*

### How it works

- `play/.../table-sidebar/learn-tips/learn-tips.ts`: `getLearnTips(state, clientId)`,
  a pure function over what the player can already see (own hand and board).
  Most relevant first: Special Conditions on your Active → empty Bench with a
  Basic in hand → an evolution in hand → Energy not yet attached this turn →
  Trainers in hand → "attack last". The setup phase gets the setup tip; the
  opponent's turn gets "follow it in the log". Spectators, replays, deleted and
  finished games get none.
- Tips restate rules the engine enforces rather than recommend plays: the
  evolve tip uses the engine's own check (`pokemonPlayedTurn < turn`) and says
  "not this turn" otherwise; the Energy tip uses `energyPlayedTurn`; the
  condition tip does not suggest retreating an Asleep/Paralyzed Pokémon. Text
  is English, like the bot's notes; only the labels are translation keys.
- `LearnTipsComponent` renders them; a collapse toggle is remembered in
  localStorage (guarded).
- Rules page: `RULES_SECTIONS` exported; `/rules#<section>` now scrolls to
  that section on load (unknown fragments are ignored).

### Tests

- play: 137 → **158 specs** (14 for `getLearnTips`, including one asserting
  every tip links to a section that exists on the rules page; 4 component
  specs: rendering, `/rules#setup` link with `target=_blank`, no tips in
  replays/deleted games, toggle; 3 rules-page specs: every anchor exists,
  fragment scrolls, unknown fragment ignored).
- `ng lint` clean; `ng build` ok (8.78 MB initial).
- Headless Chromium against the built app: `/rules#conditions` lands on the
  Special Conditions section with no page errors.
- Other packages untouched.

### Not verified

- The panel inside a live game: the server needs MySQL, which this environment
  does not run. Covered by the Karma component specs in headless Chrome only.

---

## 2026-10-30 — Benchmark win rates made measurable (`--era`)

The 2026-10-27 baseline recorded deck win rates from 16.7% to 94.4% and called
levelling the pool a prerequisite for using win rate as an AI metric. That
turned out to be the wrong diagnosis, in a useful way.

### The decks were never unbalanced

Measured within each pool, 60 games, default bot on both sides:

| pool | spread | detail |
| --- | --- | --- |
| Base Set only (5 decks) | **12.5 points** | 41.7% - 54.2% |
| BW era only (2 decks) | **13.4 points** | 43.3% - 56.7% |
| all 7 decks (cross-era) | **77.7 points** | 16.7% - 94.4% |

Both eras are individually well balanced. The entire spread came from **mixing
them in one round robin**. `bs-psychic` reads 16.7% against the mixed pool and
41.7% among its own era; `bs-fighting` reads 22.2% and 54.2%.

Twelve years of power creep separate the pools: a BW list has Professor
Juniper (draw 7), Pokemon Catcher and a 120-damage attacker, against a Base
Set list whose best draw card is Bill (draw 2). The BW deck wins on card power
whichever bot is driving it.

So no deck needed rebuilding. The harness needed to stop pairing across eras
when the question is "how good is the bot".

### Change

- `BenchDeck` carries an `era` (`bs` | `bw`); `decksForEra(era)` and
  `benchEras` exported from `src/decks.ts`.
- `--era bs` / `--era bw` on the CLI. Rejects an unknown era, and refuses to
  be combined with `--decks`.
- Default pool unchanged (all 7, cross-era), so the CI smoke run and its
  21-game round robin are untouched. That is deliberate: for crash coverage
  the cross-era pool exercises *more* card interactions per game. It just must
  not be read as a win rate.
- `docs/BOT_BENCHMARK.md` has an "Eras" section with the measurements and the
  rule: `--era` when measuring the bot, default pool when hunting crashes.

bot-bench 30 -> **32 specs**.

### Why this matters now

Learn mode (#25, #26) changed what the bot is for. It used to be an opponent;
it now explains its reasoning at the table. A bot that plays badly and explains
confidently teaches wrong play, so bot quality acquired a user-facing cost in
the last two runs. Being able to measure a change to `simple-bot` is the thing
that makes improving it possible at all.

---

## 2026-10-29 — Learn mode, part 2: "Why?" notes at the table

The bot's reasons from part 1 now reach the human player. After every bot
move that has a reason, the game log shows an indented, italic note with a
lightbulb and **Why?**, directly under the log line for that move, e.g.

> Bot attaches Fire Energy to Charmander.
> 💡 Why? Attached Fire Energy to Charmander so it can use Ember this turn.

### How it works

- `@ptcg/common`: new game log type `LOG_BOT_REASON` (`{ text }`).
- `server`: `BotGameHandler` reads `ai.explainLastAction?.()` right after
  `decodeNextAction`, dispatches the action, and only if the game accepted it
  appends a `LOG_BOT_REASON` entry from the bot's client id. Empty reasons,
  bots without the hook, and errors while explaining are all ignored, so the
  bot plays exactly as before. Prompt answers still have no reason (as in
  part 1), so no note is logged for them.
- `play`: `GameLogsComponent` renders `LOG_BOT_REASON` entries as "Why?"
  notes. A lightbulb toggle appears in the Messages header once a reason has
  been logged; it hides/shows the notes and the choice is remembered in the
  browser (localStorage, guarded). The log keeps 100 entries instead of 50
  because the notes add about one entry per bot move.
- Reasons are part of the game state's log, so they also appear in saved
  replays. Text is English (it comes from the bot); only the "Why?" label and
  tooltips are translation keys.

### Tests

- server: 35 → **40 specs** (new `bot-game-handler.spec.ts`: reason logged
  after the action with the bot's id; blank reason, throwing explainer, bot
  without the hook, rejected action → no note).
- play: 134 → **137 specs** (note rendering, toggle, no toggle without
  reasons); `ng lint` clean; `ng build` ok (8.76 MB initial).
- common 350, sets 2673, simple-bot 62, bot-bench 30 — unchanged, all green.

### Not verified

- No live end-to-end game: the server needs MySQL, which this environment
  does not run. The UI was checked in headless Chrome through the Karma
  component specs, not in a full game against the bot.

### Next

- Prompt answers (targets, searched cards, discards) still have no reason.
- Learn-mode polish: guided first game with fixed beginner decks and tips;
  links from game situations to /rules.

## 2026-10-28 — Learn mode, part 1: the bot explains its moves (bot side)

First step of the "learn against the bot" work. `simple-bot` now produces a
short plain-language reason for every turn action it takes. Nothing reaches
the web client yet; that is the next run.

### How it works

- `SimpleTactic.explain(state, player, action)` returns the reason for an
  action the tactic just chose, from the same state it looked at. The
  default (used by trainers, supporters, stadiums, tools and abilities, which
  all pick "whatever scores best in a simulation") names the action and lists
  what the bot's own simulation predicts will change: cards drawn or
  searched, damage, Knock Outs, Prize cards, healing, Energy attached or
  removed, switching, Special Conditions, new Bench Pokémon.
- Tactics with a specific rule override it so the reason matches that rule:
  **attach Energy** (which attack it unlocks this turn / later, or how much
  more Energy the attack still needs, or retreat), **evolve** (HP and damage
  gain; the bot always evolves when it can), **play Basic** (the bot always
  fills empty Bench spots), **retreat** (Special Condition, the new Active can
  attack and the old one can't, heavy damage, Energy discarded) and **attack**
  (simulated damage / Knock Out / Prizes; flags attacks that depend on coin
  flips, because the bot's simulator assumes heads).
- Passing the turn is explained too (Paralyzed, Asleep, no attacks, not
  enough Energy, or no attack scored better than passing).
- `SimpleTacticsAi.getLastDecision()` returns `{ action, tactic, reason }`;
  `explainLastAction()` returns just the text and is declared as an optional
  method on `BotAi` in `@ptcg/common`, so the server can read it from any bot.
- Explaining never changes what the bot does and never throws (errors give an
  empty reason). The 21-game bot-bench smoke run is **identical** to master
  (same seeds, same results, same action counts); the extra simulation per
  action did not measurably change the run time (~55 s either way).

Sample reasons from real bot-vs-bot games (bs-fire, bw-zekrom, bw-emboar,
bs-psychic):

- Attached Lightning Energy to Zekrom so it can use Bolt Strike this turn.
- Attached Fire Energy to Ponyta to get closer to Smash Kick (it still needs
  1 more Energy).
- Evolved Tepig into Pignite (HP goes from 60 to 100 and its strongest attack
  goes from 20 to 50 damage).
- Played Professor Juniper: it gets 7 cards from its deck.
- Played Pokemon Catcher: it brings Kadabra out as the opponent's Active
  Pokémon.
- Used Eelektrik's Dynamotor: it attaches 1 Energy to Zekrom.
- Retreated Gastly for Drowzee: Drowzee has the Energy to use Confuse Ray, and
  Gastly cannot attack yet.
- Attacked with Zekrom's Outrage: it Knocks Out Charmander and takes 1 Prize
  card.
- Ended the turn without attacking: Reshiram does not have enough Energy for
  any attack yet.

### Not covered yet

- Prompt answers (which Pokémon to target, which cards to search for, which
  Energy to discard) have no reason yet. They are decided by the prompt
  resolvers, which would need the same treatment.
- Some reasons are generic when the simulation shows no visible change
  ("the result scored better than not doing it").
- Text is English only; the web client uses translation keys for log
  messages, so the UI step must decide whether reasons are shown as plain
  text or translated.

### Next run (UI)

Server: in `BotGameHandler.onStateChange`, after `decodeNextAction`, read
`ai.explainLastAction?.()` and deliver it to the human player (a new game log
type or a side channel). Play: show it as a "Why?" note next to the bot's log
entries or in a small panel at the table; verify with ng lint, ng build and a
headless browser check.

### Tests

simple-bot **62 specs** (+18: reasons for each tactic and for passing, plus the
change-description helpers), common 350, server 35, bot-bench 30 + smoke 21
games — all passing. Lint and compile clean.

---

## 2026-10-27 (later) — play tests in CI, first recorded bot baseline

### play test suite wired into CI

`packages/play` already had 105 spec files and a headless Karma launcher
(`ChromeDocker` in `karma.conf.js`); nothing had ever run them. The suite
passes as-is: **134 specs, ~2s**. One CI step was all that was missing (#23).

The browser has to be named explicitly — the default list in `karma.conf.js`
is `['Chrome', 'ChromeDocker']` and tries to launch both, and the desktop
Chrome has no display on a runner:

```bash
npm run test -w packages/play -- --watch=false --browsers=ChromeDocker
```

GitHub Actions' preinstalled Chrome is found automatically; no `CHROME_BIN`
needed there. Locally in a container, point it at a Chromium binary.

**Caveat worth repeating:** 92 of the 105 spec files are Angular CLI
scaffolding (`expect(component).toBeTruthy()`). This is a smoke net for broken
DI, templates and module imports, not behaviour coverage.
`card-text.component.spec.ts` is the exception and the shape the rest should
grow into.

### First recorded bot benchmark baseline

`packages/bot-bench` was already complete and already in CI (lint, test,
compile, plus a 21-game seeded smoke run). Earlier entries in this log
understated it. What was missing was simply a **recorded baseline** to compare
future AI work against, so here is one.

`node dist/cli.js --games 63 --seed 7`, default bot vs default bot, 168s:

| | |
| --- | --- |
| Games completed | 63 / 63 |
| Errors, stalls, guard aborts, illegal moves | **0** |
| Rejected bot actions (GameError) | **0** |
| A vs B (mirror) | 46.0% / 54.0% |
| Went first | 50.8% |
| Turns | avg 29.5 (min 1, max 70) |
| Bot actions | avg 104.8 (min 6, max 198) |

Per deck:

| Deck | Win rate | | Deck | Win rate |
| --- | ---: | --- | --- | ---: |
| bw-zekrom | **94.4%** | | bs-water | 50.0% |
| bw-emboar | 66.7% | | bs-fire | 44.4% |
| bs-lightning | 55.6% | | bs-fighting | 22.2% |
| | | | bs-psychic | **16.7%** |

**The engine is solid under this load** — 63 full games, zero failures of any
kind, and the mirror match at 46/54 is within noise for 63 games.

**The deck pool is not balanced**, and that limits what the harness can
currently tell us. A spread of 16.7% to 94.4% means a bot-vs-bot result is
dominated by which deck each side drew, not by decision quality. Until the
pool is levelled, a change to `simple-bot` would have to be large to show up
above that noise. Levelling the benchmark decks is the prerequisite for using
win rate as an AI metric.

One oddity checked and cleared: the 1-turn game (index 10, seed 3020631464) is
not a bug. A was down to a single Basic, B knocked it out on the first turn,
A had no Bench to promote from. Correct rules behaviour, just unlucky.

### Tests

common 350, sets 2673, simple-bot 44, server 35, **play 134**, bot-bench
smoke 21 games — all passing. Lint and compile clean.

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
