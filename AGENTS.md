# Working in this repository

A browser-based practice and training platform for the physical 60-card Pokémon
TCG **Standard** format, built on RyuuPlay.

The goal: let someone practise real competitive decks for free against AI, while
an AI coach explains *why* each play is right — so they can buy a physical deck
and walk into a card shop already knowing how it works.

The scope constraint is deliberate. Current Standard plus the cards competitive
decks actually need, not every card ever printed. That constraint is what makes
this buildable.

## Layout

| Package | What it is |
| --- | --- |
| `packages/common` | Rules engine — state, actions, prompts, `Simulator`. The authority on legality. |
| `packages/sets` | Card implementations, one file per card, grouped by set |
| `packages/simple-bot` | AI opponent — tactics and prompt resolvers that propose legal moves |
| `packages/coach` | Advisory layer — snapshots, recommendations, postgame review |
| `packages/server` | Game server, websockets, persistence. No project work yet. |
| `packages/play` | Angular client. No project work yet. |
| `packages/cordova` | Android wrapper. **Not in the default build** — see below. |
| `data/meta-decks` | Curated current-meta decklists |
| `tools/meta-audit.js` | Measures card coverage against those decklists |

## Architectural invariants

These are load-bearing. Each has already caught a real bug. Changing one is a
deliberate decision, not a refactor.

1. **The simulator is the only authority on legality.** Any coaching or
   reasoning layer may rank, explain or refuse a move — it may never invent
   one. Every action shown to a human was produced and validated by the engine
   first.

2. **Reasoning layers are pluggable and non-privileged.** They sit behind
   `CoachAdvisor`, receive plain serializable data, and reply with the *id* of a
   candidate the engine already produced. Nothing in their reply carries a move,
   so no model error or hostile card text can produce an illegal play.

3. **Hidden information stays hidden.** Anything leaving the engine is built
   from one player's point of view. The opponent's hand, deck order and prize
   contents never cross that boundary. Passing raw `State` to a client or a
   model would quietly produce a cheating coach.

4. **Positional identifiers stay positional.** `state.activePlayer` is an index
   into `state.players`, not a player id. Bench slots are addressed by index by
   `RetreatAction` and `CardTarget`, so bench arrays are never compacted.

5. **An unknown outcome is reported as unknown, never as zero.** A line that
   could not be simulated reports `null`, not `0` damage.

6. **No secrets in the repository.** Nothing that reads like a key, token or
   credential gets committed. The reasoning layer runs server-side precisely so
   its credentials never reach a browser.

## Building and testing

```
npm install
npm run build --workspaces      # lint + test + compile, every package
```

Per package:

```
npm run build -w packages/coach
npm run test  -w packages/coach
```

### The cordova exception

`packages/cordova` is deliberately **excluded from the root `workspaces` array**.
It declares a build dependency fetched over plain HTTP from a third-party host,
which fails in any sandboxed or network-restricted environment — and when that
fetch fails, npm rolls the whole install back, leaving the entire monorepo
unbuildable because of an Android wrapper nobody is currently working on.

The package still exists and still works. To build the Android app, install
inside it directly:

```
npm install --prefix packages/cordova
```

If Android becomes a target again, vendor and pin that dependency over HTTPS
before putting the package back in the default build.

## Definition of done

- Tests pass in the packages you touched
- Lint passes
- CI is green — reported by CI, not asserted
- A regression test exists for any bug you fixed, and you have confirmed it
  fails against the old behaviour. A test that passes against the bug is
  decoration.

## Card coverage

`node tools/meta-audit.js` reports, per curated deck, which cards are
implemented, which need printing verification, and which are missing. It is the
measure of how close the product is to playable — a deck with zero missing and
zero verification entries can actually be played.

`--json` gives machine-readable output; `--fail-on-missing` exits non-zero.

## History

This repository was briefly worked by two AI agents in parallel, coordinating
through issue #2 under a lane-ownership protocol. That arrangement has ended and
this file replaces the protocol; ownership is now single. Issue #2 and pull
request #1 remain as the record of decisions made then — including why the coach
lives in its own package, and why `packages/simple-bot/src/coach/` is marked
superseded rather than deleted.
