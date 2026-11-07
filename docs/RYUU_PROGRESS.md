# Ryuu-play progress log

Running log of automated work on this fork. Newest entry first.

---

## Next up / Blocked on

Rewrite this block each run. It is what a self-directing run should read first;
the entries below are the record of what happened, not what to do.

**Top priority since 2026-11-06 (owner decision): modern decks, one deck
end-to-end at a time**, worked in **PR #1** (`gpt/meta-ai-trainer`), which the
owner handed from the GPT lane to Claude. Issue #2's lane split is retired.

### 0. Modern decks (top priority)

- **Where:** PR #1. Update it by *merging* `origin/master` in, never
  rebase/force-push. Squash-merge it once deck 1 is end-to-end; later decks get
  normal `claude/ryuu-` PRs.
- **Deck 1, Team Rocket's Mewtwo ex — done end-to-end** (2026-11-06, second
  entry below): 23 of 23 cards, the deck is valid in the modern format, and
  bot mirror games finish with 0 errors and 0 rejected actions (CI step
  "modern Standard smoke").
- **Deck 2, Dragapult ex — done end-to-end** (2026-11-06, third entry
  below): the Fall 2026 Regionals stock list, 24 of 24 cards.
- **Deck 3, Dragapult ex / Dusknoir — done end-to-end** (2026-11-06, fourth
  entry below), 26 of 26 cards.
- **Deck 4, Dragapult ex / Blaziken ex — done end-to-end** (2026-11-06,
  fifth entry below), 25 of 25 cards.
- **Deck 5, Alakazam / Dudunsparce — done end-to-end** (2026-11-06, sixth
  entry below), 29 of 29 cards.
- **Deck 6, N's Zoroark ex — done end-to-end** (2026-11-07, first entry
  below), 28 of 28 cards.
- **Next: deck 7.** Re-check the tier list first (thetoploader.com/meta, data of
  5 Nov 2026: 5 Slowking 5.1%, 7 Mega Excadrill 3.7%, 8 Festival Lead 3.6%,
  9 Dhelmise Banette 2.9%, 10 Basic Box 2.8%). **Mega Evolution ex** (a Mega ex gives up 3 Prize cards) is
  needed for Mega Excadrill / Mega Lopunny and is not in the engine yet.
- **Bot weakness with N's Zoroark:** the bot picks the Night Joker attack to
  copy by printed damage (`ChooseAttackPromptResolver`), so with N's Zekrom on
  the Bench it always copies Rampaging Thunder and then can't attack next turn.
  It also attacks with Night Joker when no N's Pokémon is on the Bench (the
  attack then does nothing).
- **Bot weakness with Alakazam:** it draws too much (Run Away Draw, Psychic
  Draw, Enriching Energy) and loses by deck-out in about half the mirror
  games (9 of 20).
- **Bot weakness seen with Dragapult:** it uses Dudunsparce's Run Away Draw
  even when that leaves one fragile Pokémon in play, and loses to "no Active
  Pokémon" (7 of 20 mirror games). Worth a bot change measured with
  `--decks sv-dragapult`. Tried 2026-11-06 and **not shipped**: a -200 score
  for having only one Pokémon in play. Against the old bot it went 55% with
  Dragapult, 53% in the BW era but 45% in the Base Set era (60-80 games each,
  within noise), and mirrors still ended with no Active Pokémon about as
  often. Needs a sharper fix (look at the Run Away Draw / Tuck Tail choice
  itself), measured the same way.
- **Merged with PR #1, not to be extended:** a superseded coach in
  `packages/simple-bot/src/coach`.

### Learn mode (now second)

The hold on new learn-mode UI ended on 2026-11-04 with the tutorial game;
pieces 1-3 are merged. The owner has still not played a live game. Piece 4
(deck primers and recap) waits until modern-deck work is blocked.

### 1. Tutorial game (second priority)

A slow first game that **sets each moment up, tells the player what to do,
waits for them to do it, then explains why.** Different from the guided game
(#29), which is a normal-speed game with situational tips.

Build in this order; each piece is usable when it lands:

1. ~~Fixed card order and scripted coin flips~~ — **done** (#37,
   `ScriptedArbiter`, `tutorial-decks.ts`).
2. ~~The lesson script and coach UI~~ — **done 2026-11-04**: a "Tutorial"
   button on the Games page and a coach panel at the table. See the entry
   below. Two things from the original plan were **not** built: the coach does
   not *highlight* its target on the board (it names it), and it does not
   block off-script moves (decided: guide, don't block).
3. ~~The bot pauses until the player clicks Continue~~ — **done 2026-11-05**
   (`BotPacer`, a Continue button in the coach panel). See the entry below.
4. **Next: deck primers and an after-game recap.** A primer per deck (game plan, key
   Pokémon and evolution lines, what to hold, matchups), and a recap built from
   the real game log ("the bot took 2 Prizes because your Bench was empty").
5. Smaller follow-ups: the games page does not open the new table by itself
   (true of the guided game too: the player clicks "#1 bot" under Tables);
   highlight the coach's target card on the board; the coach is in the
   sidebar, which is an overlay on phones (#21), so a phone player must open it
   (and press Continue there); the "Why?" of an attack lands in the log
   after "Turn 3 / draws a card", because the attack itself ends the turn
   before the reason is appended (seen 2026-11-05).

Reuse rather than rebuild: `TutorialCoach` / `TUTORIAL_LESSONS` in
`packages/play/src/app/table/table-sidebar/tutorial-coach/`, `getLearnTips` in
`.../learn-tips/learn-tips.ts`, `RULES_SECTIONS` in
`packages/play/src/app/rules/`, `SimpleTactic.explain` and
`PromptResolver.explain` in `packages/simple-bot/src`.

Design choices made (2026-11-04): the coach **guides, it does not block** —
every legal move stays legal, and an off-script move just moves the coach on
(a lesson already done counts as done; one that can't happen yet waits without
holding up the rest). After the last lesson the game **rolls on as a normal
game** with the Tips panel; a recap is piece 4.

### 2. Everything else, now lower priority

- **More prompt answers could get a "Why?"**: `MoveDamagePrompt`,
  `PutDamagePrompt`, `MoveEnergyPrompt`, `AttachEnergyPrompt`.
  `ChooseEnergyPrompt` was done 2026-11-03. Deck searches, the starting Pokémon
  and hand contents stay silent **on purpose**: naming those cards would show
  the human hidden information.
- **Bot quality behind the reasons.** The new Active / switch-in choice counts
  attached Energy as of 2026-11-02. Still energy-blind: `RetreatTactic` itself
  (whether to retreat) and Pokémon choices for other effects. Measure any
  change with `bot-bench --era bs` / `--era bw` against a variant keeping the
  old behaviour, as done for `energy-blind-active`. Win rates are only
  comparable **within** an era (#27).
- **Cards: BW2 (79 left), then BW3 (53 left)** — fallback only, and only
  per-card review of code being changed. The daily-run prompt rules out mass
  spec-writing for whole sets. Black & White found 0 bugs in 45 cards, so this
  is confirming correctness rather than finding bugs.

### 3. Waiting on the owner, not on a run

- **Play a live game.** Nothing in learn mode has been seen working together in
  a browser by a person. `docs/HOSTING.md`, "Option A - your own machine":
  Docker locally, SQLite, no database server.
- **Hosting stays on hold.** Do not deploy anything or create accounts.
- **Merged `claude/ryuu-*` branches pile up**, one per run. Deleting them is
  blocked for an automated session, so do not spend a run trying. The owner can
  turn on automatic branch deletion on merge in the repository settings.
  `git merge-base --is-ancestor` is the **wrong** merged-test here (every PR is
  squash-merged); check `merged_at` on the branch's PR. Exactly one `claude/*`
  branch is genuinely unmerged with no PR:
  `claude/pokemon-tcg-ai-trainer-3m3qqe` (2026-09-29). Leave it alone.

---

## 2026-11-07 (1) — N's Zoroark ex end-to-end

Branch `claude/ryuu-2026-11-07-ns-zoroark`.

- **List:** Limitless 30215, Ian McGregor, 102nd Regional Louisville KY
  10 Oct 2026 (`data/meta-decks/regional-2026-ns-zoroark.json`). Its Pokémon
  core matches a 7 Oct 2026 list on dittobase.com. N's Zoroark is #4 in
  Standard (thetoploader.com, 5 Nov 2026; not re-fetched today). A
  higher-placed list was not found this run.
- **16 new cards** (limitlesstcg.com card pages, 2026-11-07): N's Zorua,
  N's Zoroark ex, N's Purrloin, N's Reshiram, N's PP Up, Brock's Scouting,
  Black Belt's Training JTG; N's Zekrom, Air Balloon ASC; Pecharunt ex SFA;
  Tatsugiri, Secret Box (ACE SPEC) TWM; Cyrano SSP; Janine's Secret Art,
  Binding Mochi PRE; Punk Helmet PFL. No new engine rules were needed.
- meta-audit for this deck: before 11 of 28 implemented (16 missing, 1
  basic-Energy print to verify), after 28 of 28.

### Choices and limits

- Night Joker copies an attack with the same mechanism as Team Rocket's
  Mimikyu. Another N's Zoroark ex's Night Joker is blocked in the prompt (it
  would only ask again). "This Pokémon" in a copied attack is the attacker:
  Powerful Rage counts the damage on N's Zoroark ex, and a copied Rampaging
  Thunder stops N's Zoroark ex attacking next turn.
- Shred follows Rayquaza DRV: the attacker's boosts (Black Belt's Training,
  Maximum Belt) and Weakness/Resistance apply, then the damage is placed
  directly, skipping the step where the defender's damage reduction lives.
  "When damaged" effects (Lucky Helmet, Punk Helmet) still trigger. A
  defending card that changes damage at the `DealDamageEffect` step would
  still apply; none in the modern pool does that to its own damage today.
- Trade can't be used with an empty deck (the engine convention, as with
  Fezandipiti ex), though the card would allow discarding for nothing.
- Brock's Scouting asks first: 2 Basic Pokémon or 1 Evolution Pokémon.
- Janine's Secret Art can be played with no Basic D Energy in the deck (the
  search just finds nothing).
- Card costs for Rampaging Thunder (R L L C), Powerful Rage (R L) and Surf
  (R W) are as Limitless lists them; I did not check them against a scan.

### Results

- 20 mirror games (seed 1): 0 errors, 0 rejected bot actions; 15 by Prizes,
  4 by deck-out, 1 by no Active Pokémon. In 6 seeded mirrors the bot used
  every new card (Trade, Night Joker, Subjugating Chains, Attract Customers,
  N's PP Up, Janine's Secret Art, Secret Box, Cyrano, Brock's Scouting, Black
  Belt's Training, Air Balloon, Binding Mochi, Punk Helmet), with "Why?"
  notes. Bot weakness: see Next up.
- Modern smoke is now a six-deck round robin (15 games) plus two mirrors:
  0 errors. Specs: sets 2866, simple-bot 91, bot-bench 59, server 76.
  The play package was not built locally (CI builds it).

---

## 2026-11-06 (6) — Alakazam / Dudunsparce end-to-end

Branch `claude/ryuu-2026-11-06-alakazam`.

- **List:** Limitless 31085, Cho Tsun Leung, 9th Regional Gdańsk 31 Oct 2026
  (best-placed Alakazam there), `data/meta-decks/regional-2026-alakazam-dudunsparce.json`.
  #3 in Standard (thetoploader.com, 5 Nov 2026).
- **19 new cards** (limitlesstcg.com, 2026-11-06): Abra, Kadabra, Alakazam
  MEG; Dunsparce JTG 120, Lillie's Pearl JTG; Flutter Mane, Eri, Mist Energy
  TEF; Elgyem BLK (new `set-black-bolt`); Genesect SFA; Hilda WHT (new
  `set-white-flare`); Wondrous Patch, Battle Cage PFL; Sacred Ash DRI;
  Handheld Fan TWM; Nighttime Mine ASC; Telepathic Psychic Energy POR;
  Enriching Energy SSP (new `set-surging-sparks`).

### Choices and limits

- Psychic Draw (Kadabra, Alakazam) triggers on any evolve from the hand,
  Rare Candy included, and asks first.
- Abra's Teleportation Attack deals its damage from Abra first, then
  switches (so Weakness uses Abra's type).
- Lillie's Pearl: the engine does not record what caused a Knock Out, so a
  Knock Out during the opponent's attack counts, whether from damage or from
  damage counters. On the card only damage counts.
- Battle Cage stops attack damage counters (`PutCountersEffect`) and Cursed
  Blast on the other player's Bench. It does **not** stop Munkidori's
  Adrena-Brain (moving counters); I could not confirm a ruling for that.
- Sacred Ash with fewer than 5 Pokémon in the discard pile shuffles them all.
- Elgyem's Slight Shift is an attack (Limitless shows a P cost before it).

### Results

- 20 mirror games: 0 errors, 0 rejected bot actions; 11 by Prizes, 9 by
  deck-out (see bot weakness in Next up). The bot uses Powerful Hand, Dawn,
  Hilda, Eri, Sacred Ash, Special Red Card, Wondrous Patch, Hex Hurl.
- Modern smoke now a five-deck round robin (10 games) plus two mirrors.
- meta-audit 29 of 29. Specs: common 366, sets 2833, simple-bot 91, bot-bench
  56, server 72; play build ok.

---

## 2026-11-06 (5) — Dragapult ex / Blaziken ex end-to-end

Branch `claude/ryuu-2026-11-06-dragapult-blaziken`.

- **List:** Limitless 31089, Alp Ehliz, 14th Regional Gdańsk 31 Oct 2026
  (`data/meta-decks/regional-2026-dragapult-blaziken.json`). #6 in Standard
  with the best win rate of the Dragapult decks (thetoploader.com, 5 Nov 2026).
- **New cards** (limitlesstcg.com, 2026-11-06): Torchic DRI 40, Combusken
  DRI 41, Blaziken ex JTG 24, Chi-Yu TWM 39. Everything else was already in.
- Smolder-sault's "can't attack during your next turn" uses the existing
  `duringYourNextTurn` marker on the Active slot, so it follows Blaziken ex
  if it retreats and comes back the same turn.
- **Results:** 20 mirror games, 0 errors, 0 rejected bot actions (17 by
  Prizes, 3 by no Active Pokémon). Four-deck round robin, 36 games, 0 errors.
  meta-audit 25 of 25. bot-bench spec plays 3 seeded mirrors of every modern
  deck.

---

## 2026-11-06 (4) — Dragapult ex / Dusknoir end-to-end

Branch `claude/ryuu-2026-11-06-dragapult-dusknoir`.

### The list

Limitless decklist 30539, Aleksander Rutowicz, 10th at Regional Gdańsk on
31 Oct 2026. Saved as `data/meta-decks/regional-2026-dragapult-dusknoir.json`.
Dragapult Dusknoir is the #2 Standard deck (thetoploader.com, data of 5 Nov
2026). It shares 17 cards with Dragapult; 7 were new.

### New cards (limitlesstcg.com card pages, 2026-11-06)

Duskull, Dusclops, Dusknoir PRE (new `set-prismatic-evolutions`), Dawn PFL
(new `set-phantasmal-flames`), Rare Candy MEG (same code as Rare Candy SUM),
Special Red Card CRI, Team Rocket's Watchtower DRI.

### Choices and limits

- Cursed Blast (Dusclops 5 counters, Dusknoir 13): the user is Knocked Out
  through the normal Knock Out check, so the opponent takes its Prize card
  and the Knock Out counts for Fezandipiti ex / Unfair Stamp next turn.
- Special Red Card puts the opponent's hand under their deck without
  shuffling it first (the engine has no shuffle for a hand; nobody can see
  the order).
- Team Rocket's Watchtower blocks every Ability of a C Pokémon in play
  through the engine's PowerEffect check (Meowth ex, Dudunsparce here).
- Dawn asks three times (Basic, then Stage 1, then Stage 2).

### Results

- 20 mirror games: 0 errors, 0 rejected bot actions (13 by Prizes, 7 by no
  Active Pokémon). The bot uses Cursed Blast, Come and Get You, Flip the
  Script and Adrena-Brain in these games.
- Three-deck round robin, 30 games: Dragapult 17-3, Dragapult Dusknoir 8-12,
  Team Rocket's Mewtwo 5-15, 0 errors. (Bot play, not a meta judgment.)
- meta-audit: this list 26 of 26. The older NAIC Dragapult lists now miss
  only 3 cards each.
- Specs: common 366, sets 2794, simple-bot 91, bot-bench 50, server 72; play
  build ok.

---

## 2026-11-06 (3) — Dragapult ex end-to-end

Branch `claude/ryuu-2026-11-06-dragapult`.

### The list

Re-checked on 2026-11-06: Dragapult ex is still the most-played Standard deck
(thetoploader.com, Oct/Nov 2026). The list is Limitless decklist 29678, the
most common Dragapult list at Regional Gdańsk on 31 Oct 2026 (3rd place and five
more top-41 finishes). It is saved as `data/meta-decks/regional-2026-dragapult.json`
with its source. The older NAIC Dusknoir/Blaziken lists are kept but not built.

### Cards (all text read from limitlesstcg.com card pages on 2026-11-06)

Dreepy, Drakloak, Dragapult ex (Tera), Munkidori, Unfair Stamp (ACE SPEC)
TWM; Budew, Fezandipiti ex ASC; Dunsparce, Dudunsparce, Buddy-Buddy Poffin
TEF; Meowth ex, Judge, Poké Pad, Crushing Hammer, Rosa's Encouragement POR
(new `set-perfect-order`); Crispin SCR (new `set-stellar-crown`); Boss's
Orders, Risky Ruins MEG. Reprints reuse older code: Crushing Hammer POR =
Crushing Hammer EPO, Boss's Orders MEG = Boss's Orders (Ghetsis) PAL.

### Engine

- `Player.knockedOutTurn` and `StateUtils.wasKnockedOutLastTurn` for "if any
  of your Pokémon were Knocked Out during your opponent's last turn"
  (Fezandipiti ex, Unfair Stamp). Default -1; old saved games never match.
- `StateUtils.hasRuleBox` (ex, GX, LV.X) for Poké Pad.

### Choices and limits

- Phantom Dive's 6 damage counters go through `PutCountersEffect`, so they
  land on a Benched Tera Pokémon (counters are not damage) but are stopped
  by effects that block attack effects.
- Munkidori asks how many counters to move (3, 2 or 1; the bot takes the most).
- Dudunsparce's Run Away Draw is refused when it is your only Pokémon in play
  (doing it would lose the game on the spot). Not on the card; a guard.
- Budew's Itchy Pollen also blocks Pokémon Tools (they are Item cards).
- Risky Ruins: Pokémon already in play when the turn starts, or when Risky
  Ruins comes into play, are not affected. One edge is not handled: the same
  card put onto the Bench twice in one turn only gets counters the first time.
- Meowth ex's Tuck Tail returns it to the hand at the end of the attack turn.

### Results

- 20 mirror games (`--decks sv-dragapult --seed 1`): 0 errors, 0 rejected
  bot actions; 14 ended by Prizes, 7 by "no Active Pokémon" (see the bot
  weakness in Next up). Dragapult vs Team Rocket's Mewtwo, 20 games: 14-6 for
  Dragapult, 0 errors.
- `bench:smoke:modern` now plays both mirrors and the cross matchup in CI.
- meta-audit, Dragapult list: before 3 of 24 (Lillie's Determination, Ultra
  Ball, Night Stretcher); after 24 of 24.
- Specs: common 366, sets 2783, simple-bot 91, bot-bench 47, server 72; play
  build ok.

### Not verified

- Nobody has played Dragapult by hand in the browser.
- Card-page reads were done through a summarising fetch tool; numbers and
  short texts were quoted back, but a typo in a long text could slip through.

---

## 2026-11-06 (2) — Team Rocket's Mewtwo ex end-to-end: Mimikyu, Tera, bot mirror

The owner approved merging PR #1 early and asked to keep going. PR #1 was
squash-merged; this work is on `claude/ryuu-2026-11-06-tr-mewtwo-complete`.

### What changed

- **Team Rocket's Mimikyu DRI 87** (HP 60, P, Weakness D, Resistance F -30,
  Retreat 0 — Limitless). *Gemstone Mimicry* (P C) copies an attack of the
  opponent's **Active Tera Pokémon**, ignoring its cost; against anything else
  it does nothing.
- **Tera in the engine:** `CardTag.TERA`, and the Tera rule — a Benched Tera
  Pokémon takes no damage from attacks (either player's). Applied where attack
  damage is put on a Pokémon (`PutDamageEffect`), so it covers both normal and
  Bench-sniping damage; damage counters (an effect, not damage) still land.
  No Tera cards exist in the code yet.
- **Bot bench, modern deck:** `modernBenchDecks` in `packages/bot-bench`
  (`sv-tr-mewtwo`, the NAIC list) played with `modernStandardRules()` when both
  decks are modern (`rulesForDecks`). Kept out of the default pool so the older
  benchmarks and the smoke run are unchanged. New `npm run
  bench:smoke:modern` (10 mirror games) runs in CI.
- **Card text check finished:** Ultra Ball MEG, Night Stretcher SFA, Bug
  Catching Set TWM and Energy Switch SVI now also read from card pages; all
  match. Every card of the list has now been checked against a card page.

### Results

- `--decks sv-tr-mewtwo --games 20 --seed 1`: 20 wins (17 by Prizes, 3 by
  deck-out), 0 errors, 0 rejected bot actions, 0 guard/stalled, avg 23 turns.
- New bot-bench spec plays 3 seeded mirrors under the modern rules and checks
  the bots give "Why?" reasons for their moves (more than 10 per game).
- meta-audit, Team Rocket's Mewtwo ex: 23 of 23 implemented, 0 missing.
- Specs: common 362, sets 2742, simple-bot 91, bot-bench 44, server 72; play
  187 Karma specs; lint and `ng build` ok.

### Not verified

- Nobody has played this deck by hand in the browser yet.
- The bot's play quality with it (e.g. whether it uses Erasure Ball's
  discards well) was not judged, only that games finish cleanly.

---

## 2026-11-06 — Modern Standard format, first-turn attack rule, 4 more Team Rocket's Mewtwo ex cards

Worked on PR #1 (`gpt/meta-ai-trainer`). Not merged: the deck still misses one
card (Team Rocket's Mimikyu) and has not been bot-benched.

### What changed

- **A real modern format.** New format **"Standard (Scarlet & Violet)"**
  (`packages/sets/src/formats.ts`, registered in `init.js` and in bot-bench's
  `card-setup.ts`). It holds only the Scarlet & Violet / Mega Evolution sets
  plus the 8 basic Energy types (reused from Diamond & Pearl; no Fairy). The
  old **"Standard"** format is back to exactly what master has — PR #1 had
  added the modern sets to it, which would have mixed eras. It is listed
  first, so the create-game popup picks it when the player has a deck for it.
- **Today's first-turn rules** in that format: the player going first draws,
  can't play a Supporter (unless the card allows it, e.g. Team Rocket's Proton)
  and **can't attack**. The last one is a new engine rule,
  `Rules.firstTurnAttack` (default `true`, so older formats and old saved games
  play as before; only an explicit `false` blocks). There is a matching
  checkbox in the create-game popup.
- **New cards** (text read from Limitless / Dittobase / pkmncards on
  2026-11-06): Team Rocket's Articuno DRI 51, Team Rocket's Energy DRI 182,
  Lucky Helmet TWM 158, Maximum Belt TEF 154 (ACE SPEC, new
  `set-temporal-forces`).
- **Fixes to cards already on PR #1:** Team Rocket's Spidops' Ability is
  *Charging Up* (was "Charge Up"); Team Rocket's Mewtwo ex's Power Saver now
  stops applying when Abilities are blocked.

### Verified against the real card text

Team Rocket's Mewtwo ex, Spidops, Tarountula, Articuno, Energy, Ariana,
Giovanni, Proton, Petrel, Factory, Transceiver; Lillie's Clefairy ex, Lillie's
Determination, Prism Tower, Lucky Helmet, Maximum Belt (fetched pages).
Ultra Ball, Night Stretcher, Bug Catching Set, Energy Switch: checked from
knowledge only.

### Known limits

- Repelling Veil (Articuno) blocks every attack effect that goes through the
  engine's attack-effect classes (Special Conditions, discards, moves, damage
  counters, markers...). An attack that changes the board directly without
  those classes is not blocked.
- Pokémon ex and old Pokémon-EX share one tag, so Maximum Belt would also hit
  an old Pokémon-EX; only matters if eras are mixed (the "all cards" option).

### Tests

New specs: first-turn attack rule (common, 4), modern format (sets, 5:
rules, basic Energy, no old sets, every implemented card of the Mewtwo list is
in the format, ACE SPEC limit), Articuno (8), Team Rocket's Energy (5), Lucky
Helmet (4), Maximum Belt (3), Mewtwo ex (4), Spidops (3).
common 358, sets 2738, simple-bot 91, bot-bench 38, server 72 specs, all
passing; play 187 Karma specs pass, lint and `ng build` ok; bench smoke 0
rejected actions, 0 errors (older eras only — no modern deck in the pool yet).

meta-audit, Team Rocket's Mewtwo ex: before 18 of 23 implemented, 5 missing;
after 22 of 23, 1 missing (Team Rocket's Mimikyu).

---

## 2026-11-05 — Tutorial game, piece 3: the bot waits for Continue

In a tutorial game the bot no longer plays its whole turn in a blur. On its
turn the Tutorial panel shows "The bot waits for you. Read its last move and
the "Why?" note in the game log, then press Continue for its next move." and a
**Continue** button. Each press lets the bot make exactly one move (attach,
attack, end turn, answer its own prompt), and that move's "Why?" note lands in
the log before the next pause. The bot-turn lesson now mentions the button.
Once all 12 lessons are done the panel tells the server to stop pausing, and
the rest of the game plays at normal bot speed. Tutorial games also have **no
clock** now: the bot spends its turns waiting for the player, and a slow first
game could otherwise run either player's 30 minutes out.

### How it works

- `BotPacer` (server, `game/core/bot-pacer.ts`): `wait()` / `step()` /
  `release()` / `clear()`. One press = one move; presses don't add up; a
  press left over when the bot's turn ends is dropped so it can't skip the
  first pause of the next turn. `release()` lets everything through.
- `Game.botPacer` is set only by `createTutorialGame` (with
  `timeLimit = 0`). Normal and guided games have none and are untouched
  (spec'd).
- `BotGameHandler` waits on the pacer only when it is the bot's own turn in
  `PLAYER_TURN`; setup and answers on the player's turn are never paced. It
  decides the move first, then waits, then dispatches and logs the reason, as
  before.
- New socket message `game:action:botContinue {gameId, release?}`; only a
  player in the game may send it, and it is a no-op without a pacer.
- Client: `TutorialView.botWaiting` is true on the bot's turn when the player
  has no prompt of their own to answer (e.g. choosing a new Active after a
  Knock Out), and false once the tutorial is finished.
  `GameService.botContinueAction`.

### Tests

- server 60 → **72 specs** (5 pacer, 5 handler pacing, 2 tutorial game).
  A first version of one handler spec let a released move land in the next
  spec under some random seeds; fixed by awaiting it, then checked with 8
  seeds.
- play 182 → **187 specs** (2 coach, 3 coach panel). `ng lint` clean,
  `ng build` ok (8.83 MB initial).
- **Headless browser run** (Playwright, local server on SQLite, built UI):
  Tutorial → table → chose Charmander → End your turn. On the bot's turn the
  Continue box showed and the log did not change for 11 seconds. Continue #1:
  "bot attaches a Lightning Energy to the Pikachu" + "Why? Attached Lightning
  Energy to Pikachu so it can use Gnaw this turn." Continue #2: Gnaw, end of
  turn, and its "Why?". Then it was the player's turn and the button was gone.
- Not seen running: the release after the last lesson (spec only), a phone
  layout (the coach is in the sidebar overlay, as before), and a person
  playing.

---

## 2026-11-04 — Tutorial game, piece 2: the lesson script and coach

There is now a **Tutorial** button on the Games page, next to "Guided first
game". It starts a game against the bot with the fixed-order tutorial decks
from #37, and the table shows a **Tutorial** panel in the sidebar, above Tips.
The panel tells the player what to do ("Your move: Drag Fire Energy from your
hand onto Charmander."), waits until the board shows they did it, then says
why it mattered ("Why: Attacks cost Energy ... You can attach only one Energy
card per turn, so attach one every turn."). Each step has a "Learn more" link
to the matching section of /rules, and a "1 of 12" progress count.

The 12 lessons, in order: setup and Prizes, attach Energy, Bench a Pokémon,
play a Trainer (Bill), attack and damage, the bot's turn, evolve, Weakness,
retreating, taking a Prize, losing a Prize, how the game is won. "Do" lessons
finish when the game state shows the move; "read" lessons finish on a "Got it"
button. After the last one the panel says the tutorial is complete and the game
carries on normally.

### How it works

- `state.rules.tutorial` (new, default false) marks the game. It is set only by
  `createTutorialGame`, before the first dispatch; the engine never reads it.
  A spec asserts the guided game and default settings are not marked.
- `tutorial-coach.ts` (play) holds the lesson list and `TutorialCoach`, which
  works the current lesson out from the state on every change and remembers
  only which lessons are finished. Every instruction and "why" is built from
  the cards actually on the board or in the player's own hand (names, attack
  costs, HP, damage, Weakness, Retreat Cost), so the text can't drift from the
  game, and nothing hidden is shown.
- Guides, does not block (see the design note above). Lessons the player did
  out of order are counted; lessons done before the coach first saw the game
  (a page reload) finish quietly rather than explaining an old move.
- The Trainer lesson only uses a "Draw ..." Trainer, so it can't send the
  player to play a card that would fail for want of a target.

### Tests

- play 163 → **182 specs** (12 for the lesson script, 4 for the coach panel,
  3 for the Tutorial button). `ng lint` clean, `ng build` ok.
- server 59 → **60 specs** (the tutorial flag). common 350, sets 2698,
  simple-bot 89, bot-bench 38: all pass; smoke benchmark 0 errors / 0 rejected
  bot actions.
- **Headless browser run** (Playwright against a local server with SQLite):
  Tutorial button → table → setup lesson; chose Charmander; then, by dragging
  cards as a player would, attached Fire Energy, Benched Growlithe, played Bill
  and attacked with Scratch. After each move the panel showed the right "why"
  and the next lesson, ending on "Charmeleon evolves from Charmander. Drag
  Charmeleon from your hand onto Charmander to evolve it." on turn 3. The bot's
  own "Why?" notes appeared in the log as before. Card images were blank (no
  scans downloaded in the sandbox).

### Not verified

- Lessons after evolving (Weakness, retreat, Prizes, the end) were checked only
  in specs, not in the browser.
- The bot's turn is too fast for the "bot's turn" lesson to be seen in time;
  that is piece 3.
- Not played by a person.

---

## 2026-11-03 — "Why?" note for which Energy the bot discards

When the bot retreats, or uses an attack that discards Energy (Ninetales'
Fire Blast, Charizard's Fire Spin and about 30 others), it now says which
Energy it gave up and, when there was a real choice, why it kept the rest.
That is a small but real lesson for a new player: pay with plain Energy and
keep the flexible ones (Rainbow, Double Colorless) for later.

Examples, from 40 headless bot-vs-bot games on the bench decks:

- Discarded Fire Energy for the effect, which asks for 1 Fire Energy. It kept
  Double Colorless Energy and Fire Energy: the bot pays each typed Energy with
  the Energy that can provide the fewest types and uses no more Energy than
  needed.
- Discarded Water Energy to pay the Retreat Cost (1 Colorless). It kept 2 Water
  Energy.
- Discarded Lightning Energy to pay the Retreat Cost (1 Colorless). That was all
  the Energy it could choose from.

### How it works

- `ChooseEnergyPromptResolver.explain` restates the resolver's real order:
  typed costs first, each with the Energy that can provide the fewest types;
  then the Colorless part with the Energy that provides the least (its
  existing `getEnergyCardScore`); then Energy that is not needed is dropped.
  Only the rules that applied to this cost are named.
- No rule is quoted when the only Energy left is more of the same card (there
  was no real choice), or when it used everything. When the Energy cannot pay,
  it says so ("Did not retreat: ...").
- Attached Energy is public, so nothing hidden is revealed.
- New helpers in `explain-utils`: `describeCost` ("1 Fire and 2 Colorless",
  Colorless last as on the cards) and `countedNames` ("2 Fire Energy and
  Rainbow Energy").
- Bot behaviour is unchanged; this only adds the note. It reuses the existing
  `LOG_BOT_REASON` path, so no UI change.

### Tests

- simple-bot 80 → **89 specs** (7 for the energy note: retreat, typed discard
  keeping Rainbow, mixed cost listing all three rules, all Energy used, only
  same cards left, cannot pay, other prompts silent; 2 for the helpers). Lint
  clean.
- bot-bench 38, server 45 specs pass; smoke (21 seeded games) passes with 0
  errors/guard/stalled/illegal moves.

### Not verified

- Not seen in a live game in the browser; the note rendering is the existing,
  spec-covered `LOG_BOT_REASON` path.

---

## 2026-11-02 — Bot: put up a Pokémon that can attack

The 2026-11-01 notes made a weak habit visible: when the bot chose its new
Active Pokémon after a Knock Out, or which Pokémon to switch in, it ranked them
by HP, attack damage, Abilities and Retreat Cost and **ignored attached
Energy**. It could promote a big Pokémon with no Energy over a smaller one
ready to attack, and the "Why?" note would honestly explain that, which is
the wrong lesson for a learner. "Promote something that can attack" is one of
the first rules of thumb a new player is taught.

### What changed

- `ChoosePokemonPromptResolver`: for `CHOOSE_NEW_ACTIVE_POKEMON` and
  `CHOOSE_POKEMON_TO_SWITCH`, a Pokémon whose attached Energy already pays for
  one of its attacks gets `scores.activeChoice.canAttack` (default 60) added to
  its Pokémon score. That is enough to beat a typical HP or damage gap, so
  being able to attack decides first and the old factors break ties. The
  ranking is the same function for both sides, so on the opponent's side
  (Gust of Wind style switches) the bot now prefers to drag up a Pokémon that
  **cannot** attack yet.
- Energy is read as printed (`provides` x `provideAmount`, matched with
  `StateUtils.checkEnoughEnergy`), the same reading the bot's `EnergyScore`
  uses. Effects that change what Energy provides are not simulated here.
- The "Why?" note follows the real ranking. For these prompts the measure
  reads "first whether the attached Energy already pays for an attack, then
  HP, attack damage, Abilities and Retreat Cost", and when Energy decided it,
  one more sentence: "Its attached Energy already pays for an attack, so it
  can attack right away." (or, for the opponent's Pokémon, "It does not have
  the Energy for any of its attacks yet, so it cannot attack right away.").
- New bot-bench variant `energy-blind-active` (`canAttack: 0`) keeps the old
  behaviour for comparison. Setting the score to 0 also restores the old
  note wording.

### Tests

- simple-bot 73 → **80 specs**: promotes the ready Pokémon over a bigger one
  (with the full note), Colorless vs wrong-type Energy, all ready → falls back
  to HP, switch-in prompt, opponent's unready Pokémon dragged up (with note),
  other prompts ignore Energy, `canAttack: 0` restores the old choice and
  wording. Lint clean.
- bot-bench 38, server 45 specs pass; smoke (21 seeded games) passes with 0
  errors/guard/stalled/illegal moves. common, sets and play are unchanged.
- Strength, 200 games per era, seed 5, default vs `energy-blind-active`:
  BS 49.0% / 51.0%, BW 53.5% / 46.5%. Both within noise. This is a change for
  what the learner sees the bot do, not a measured strength gain; it is not a
  measured loss either.

### Not verified

- Not seen in a live game in the browser; the note rendering is the existing,
  spec-covered `LOG_BOT_REASON` path.
- How often the new rule changes the choice in real games was not counted.

---

## 2026-11-01 — Learn mode: "Why?" notes for the bot's choices in prompts

Until now the bot explained its turn actions (attach, evolve, play a Trainer,
retreat, attack, pass) but not the choices it makes when a card or the rules
ask it to pick something. Those are often the interesting ones for a learner:
which Pokémon it promotes after a Knock Out, which of your Pokémon it drags
out with Gust of Wind, which Pokémon it puts damage on. They now get a note.

Examples, from headless bot-vs-bot games on the bench decks:

- Chose Raichu as its new Active Pokémon: it is its own strongest Pokémon by
  the bot's measure (comparing HP, attack damage, Abilities and Retreat Cost).
- Chose the opponent's Squirtle to switch into the Active Spot: it is the
  opponent's weakest Pokémon by the bot's measure (...).
- Chose the opponent's Alakazam to discard cards from: it is the opponent's
  strongest Pokémon by the bot's measure (...).
- Chose Pikachu as its new Active Pokémon: it was the only choice.

### Why this and not the BW2 cards the last entry pointed at

The daily-run prompt puts learn features first and rules out mass
spec-writing for whole sets. This change is bot-side only: it reuses the
existing `LOG_BOT_REASON` note (the server already logs a reason for *any*
bot action, prompt answers included, as soon as the bot provides one), so it
adds no new screen to the UI the owner is about to evaluate.

### How it works

- `PromptResolver.explain(state, player, prompt, action)`: new, returns `''`
  by default. `SimpleTacticsAi.resolvePrompt` calls it (guarded, like the
  tactics) and, when it is non-empty, records a `BotDecision` with the
  resolver's name as `tactic`. No reason → no decision → no note, as before.
- `ChoosePokemonPromptResolver.explain` describes the ranking the resolver
  really uses: the Pokémon score (HP, attack damage, Abilities, Retreat
  Cost), highest first for helpful effects on its own Pokémon and harmful
  effects on the opponent's, lowest first otherwise. It says "only choice",
  "strongest"/"weakest" on that side, "all rank equally ... took the first
  one", lists several picks, or explains choosing none.
- `ChooseCardsPromptResolver.explain` only covers **discards from the bot's
  own hand** (the cards become public): the least useful cards to keep by its
  hand evaluation. Deck searches, starting Pokémon and other card choices get
  no reason, because naming them would reveal hidden cards to the human.

### Tests

- simple-bot 62 → **73 specs** (7 for the Pokémon reasons: own strongest,
  opponent's strongest as damage target, forced weakest, cancel, only choice,
  several picks, other prompt; 2 for cards: hand discard named, deck search
  silent; 2 in `SimpleTacticsAi`: a prompt answer records the resolver and
  its reason, a hidden-card answer records none). Lint clean.
- bot-bench smoke (21 seeded games) **identical** to master apart from wall
  time: explaining does not change what the bot does. bot-bench 38, server 45
  specs pass; common, sets and play are unchanged.

### Not verified

- No hand discard came up in the 21 bench games, so that sentence is covered
  by spec only.
- Not seen in a live game in the browser; the note rendering is the existing,
  spec-covered `LOG_BOT_REASON` path.

### Noticed, not changed

The bot picks its new Active without looking at attached Energy (see Next up,
item 3). The note reports the real reason, which is the point, but it is a
weak play to learn from.

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
