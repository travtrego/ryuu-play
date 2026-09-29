#!/usr/bin/env node

/*
 * Plays a full AI-vs-AI game from curated decklists, with no database and no
 * server, and reports the outcome.
 *
 * Why this exists:
 * Everything else in this repository checks parts. This checks that a game
 * actually happens - that real cards load, that the bot can take legal actions
 * with them from first turn to last, and that somebody wins. It is the
 * difference between "the deck audits as complete" and "the deck is playable",
 * and it is also the first step toward batch deck testing.
 *
 * Usage:
 *   node tools/play-match.js
 *   node tools/play-match.js --deck1 <id> --deck2 <id>
 *   node tools/play-match.js --runs 10        # batch, one line per game
 *   node tools/play-match.js --runs 20 --random  # independent samples
 *   node tools/play-match.js --coach          # sample coach advice mid-game
 *
 * Requires the workspaces to be built.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DECK_DIR = path.join(ROOT, 'data', 'meta-decks');

const argv = process.argv.slice(2);
const args = new Set(argv);
const flagValue = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
};

const runs = Number(flagValue('--runs', '1'));
const showCoach = args.has('--coach');
const deck1Id = flagValue('--deck1', 'naic-2026-team-rocket-mewtwo');
const deck2Id = flagValue('--deck2', 'team-rocket-mewtwo-spidops');

// A game that cannot finish within this many bot actions is stuck, not slow.
const MAX_STEPS = 5000;

let engine;
try {
  engine = {
    common: require(path.join(ROOT, 'packages', 'common')),
    sets: require(path.join(ROOT, 'packages', 'sets')),
    bot: require(path.join(ROOT, 'packages', 'simple-bot')),
    coach: require(path.join(ROOT, 'packages', 'coach')),
  };
} catch (error) {
  process.stderr.write(`play-match: build the workspaces first (${error.message})\n`);
  process.exit(3);
}

const {
  CardManager, Store, AddPlayerAction, GamePhase, GameWinner, BotArbiter,
  BotFlipMode, BotShuffleMode,
} = engine.common;

// The default arbiter is fully deterministic (all heads, no shuffle), so a
// batch of runs without this flag replays one identical game N times. Pass
// --random for independent samples.
const randomise = args.has('--random');
const arbiterOptions = randomise
  ? { flipMode: BotFlipMode.RANDOM, shuffleMode: BotShuffleMode.RANDOM, flipResults: [] }
  : {};

const cardManager = CardManager.getInstance();
cardManager.defineFormat('Standard', Object.values(engine.sets.standardSets));

// CardManager indexes by fullName ("Ultra Ball MEG"); decklists carry the
// printed name plus a set code. Basic energy is the exception - it sits under
// whichever set the engine carries and is identical across printings.
const byName = {};
cardManager.getAllCards().forEach(card => {
  if (byName[card.name] === undefined) {
    byName[card.name] = card;
  }
});
const resolveCard = (name, set) =>
  cardManager.getCardByName(`${name} ${set}`) || byName[name];

function buildDeck(id) {
  const file = path.join(DECK_DIR, `${id}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`no such deck: ${id}`);
  }

  const deck = JSON.parse(fs.readFileSync(file, 'utf8'));
  const names = [];

  for (const entry of deck.cards) {
    const card = resolveCard(entry.name, entry.set);
    if (card === undefined) {
      throw new Error(`${deck.name}: engine cannot build "${entry.name} ${entry.set}"`);
    }
    for (let i = 0; i < entry.count; i++) {
      names.push(card.fullName);
    }
  }

  return { name: deck.name, names };
}

function playMatch(deckA, deckB, sampleCoach) {
  const arbiter = new BotArbiter(arbiterOptions);
  const store = new Store({ onStateChange() { } });

  // Arbiter prompts (coin flips, shuffles) belong to nobody's bot. They are
  // drained from here rather than from onStateChange, because dispatching
  // inside that callback nests a dispatch within a dispatch and a long run of
  // consecutive prompts then grows the stack.
  const drainArbiterPrompts = () => {
    for (let guard = 0; guard < 500; guard++) {
      const pending = store.state.prompts.filter(p => p.result === undefined);
      let acted = false;
      for (const prompt of pending) {
        const action = arbiter.resolvePrompt(store.state, prompt);
        if (action !== undefined) {
          store.dispatch(action);
          acted = true;
          break;
        }
      }
      if (!acted) {
        return;
      }
    }
  };

  const factory = new engine.bot.SimpleBot('bot');
  const ais = [factory.createBotAi(1, deckA.names), factory.createBotAi(2, deckB.names)];
  const advisor = new engine.coach.HeuristicCoachAdvisor();

  store.dispatch(new AddPlayerAction(1, 'Player One', deckA.names));
  drainArbiterPrompts();
  store.dispatch(new AddPlayerAction(2, 'Player Two', deckB.names));
  drainArbiterPrompts();

  let steps = 0;
  let rejected = 0;
  let idle = 0;
  let sampled = 0;

  while (store.state.phase !== GamePhase.FINISHED && steps < MAX_STEPS) {
    steps++;
    drainArbiterPrompts();
    if (store.state.phase === GamePhase.FINISHED) {
      break;
    }

    let acted = false;
    for (const ai of ais) {
      let action;
      try {
        action = ai.decodeNextAction(store.state);
      } catch (error) {
        action = undefined;
      }
      if (action === undefined) {
        continue;
      }

      if (sampleCoach && sampled < 3 && steps > 20
        && store.state.phase === GamePhase.PLAYER_TURN) {
        const playerId = store.state.players[store.state.activePlayer].id;
        const advice = advisor.getRecommendation(store.state, playerId);
        if (advice) {
          sampled++;
          process.stdout.write(`\n[turn ${store.state.turn}] coach for player ${playerId}\n`);
          process.stdout.write(`  ${advice.kind}${advice.question ? ` -> ${advice.question}` : ''}\n`);
          process.stdout.write(`  recommends: ${advice.description}\n`);
          process.stdout.write(`  because   : ${advice.rationale}\n`);
        }
      }

      try {
        store.dispatch(action);
        acted = true;
      } catch (error) {
        rejected++;
      }
      break;
    }

    idle = acted ? 0 : idle + 1;
    if (idle > 5) {
      break;
    }
  }

  const state = store.state;
  return {
    finished: state.phase === GamePhase.FINISHED,
    phase: GamePhase[state.phase],
    winner: GameWinner[state.winner],
    turns: state.turn,
    steps,
    rejected,
    players: state.players.map(p => ({
      name: p.name,
      prizesLeft: p.getPrizeLeft(),
      deck: p.deck.cards.length,
    })),
  };
}

function main() {
  const deckA = buildDeck(deck1Id);
  const deckB = buildDeck(deck2Id);

  process.stdout.write(`P1: ${deckA.name} (${deckA.names.length} cards)\n`);
  process.stdout.write(`P2: ${deckB.name} (${deckB.names.length} cards)\n`);

  let finished = 0;
  let rejectedTotal = 0;

  for (let run = 0; run < runs; run++) {
    const result = playMatch(deckA, deckB, showCoach && run === 0);

    if (result.finished) {
      finished++;
    }
    rejectedTotal += result.rejected;

    process.stdout.write(
      `run ${run + 1}: ${result.phase} winner=${result.winner} `
      + `turns=${result.turns} steps=${result.steps} rejected=${result.rejected}\n`
    );

    if (runs === 1) {
      result.players.forEach(p => {
        process.stdout.write(`  ${p.name}: prizes left ${p.prizesLeft}, deck ${p.deck}\n`);
      });
    }
  }

  process.stdout.write(`\n${finished}/${runs} games finished, ${rejectedTotal} rejected actions\n`);

  // An unfinished game or an illegal action is a real failure: it means the
  // deck is not actually playable, whatever the coverage audit says.
  if (finished < runs || rejectedTotal > 0) {
    process.exitCode = 2;
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`play-match failed: ${error.message}\n`);
  process.exitCode = 1;
}
