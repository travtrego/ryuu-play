import { Rules } from '@ptcg/common';
import { BenchDeck } from './decks';
import { BotVariant } from './bot-variants';
import { GameLimits, GameOutcome, GameResult, playGame } from './headless-game';
import { deriveSeed } from './prng';
import { registerCardSets } from './card-setup';

export interface BenchmarkConfig {
  games: number;
  seed: number;
  /** The two competing bots. Use the same variant twice for a mirror benchmark. */
  sideA: BotVariant;
  sideB: BotVariant;
  /** Decks in the pool. Matchups are every unordered pair (a, b), a != b; a single deck plays mirrors. */
  decks: BenchDeck[];
  limits?: Partial<GameLimits>;
  /** Replay only these game indexes (still seeded from `seed`), e.g. to debug one game. */
  only?: number[];
  onGame?: (game: BenchGame) => void;
}

export type Side = 'A' | 'B';

export interface BenchGame extends GameResult {
  index: number;
  /** Deck played by side A / side B. */
  deckA: string;
  deckB: string;
  /** Which side sat in seat 0 (state.players[0]). */
  seat0: Side;
  winnerSide?: Side;
  /** Side that took turn 1. */
  firstSide?: Side;
}

export interface WinStats {
  games: number;
  wins: number;
  losses: number;
  /** Games that did not produce a winner (draw, no-winner, guard, stalled, illegal-moves, error). */
  other: number;
  winRate: number;
}

export interface LengthStats {
  avg: number;
  max: number;
  min: number;
}

export interface BenchmarkSummary {
  games: number;
  seed: number;
  sideA: string;
  sideB: string;
  outcomes: { [K in GameOutcome]: number };
  guardReasons: { [reason: string]: number };
  /** How finished games ended (a game can have more than one reason, e.g. a draw). */
  endReasons: { [reason: string]: number };
  side: { A: WinStats; B: WinStats };
  /** Per deck, counting every game the deck played regardless of side. */
  decks: { [deck: string]: WinStats };
  /** Per ordered matchup "deckX vs deckY", from deckX's point of view. */
  matchups: { [matchup: string]: WinStats };
  /** Win rate of whoever took turn 1, among games with a winner. */
  firstPlayer: WinStats;
  turns: LengthStats;
  actions: LengthStats;
  invalidMoves: number;
  invalidMoveMessages: { [message: string]: number };
  errors: Array<{ index: number; seed: number; deckA: string; deckB: string;
    message: string; source: string; turn: number; phase: string; action?: string; side?: Side; stack?: string }>;
  /** Index/seed/details for every game that did not end in win/draw. */
  problemGames: Array<{ index: number; seed: number; outcome: GameOutcome; deckA: string; deckB: string;
    turns: number; actions: number; detail?: string }>;
  durationMs: number;
}

/**
 * Deck and seat assignment for game `index`. With P = number of unordered deck
 * pairs, games 0..P-1 play every pair once (a full round robin), games
 * P..2P-1 replay them with the decks swapped between sides, and so on.
 * Seats alternate every game, so over 2P games each pair is played with
 * both deck assignments and both seat orders.
 */
export function scheduleGame(index: number, decks: BenchDeck[]): { deckA: BenchDeck; deckB: BenchDeck; seat0: Side } {
  const pairs: Array<[BenchDeck, BenchDeck]> = [];
  for (let i = 0; i < decks.length; i++) {
    for (let j = i + 1; j < decks.length; j++) {
      pairs.push([decks[i], decks[j]]);
    }
  }
  if (pairs.length === 0) {
    pairs.push([decks[0], decks[0]]);
  }
  const pair = pairs[index % pairs.length];
  const swapped = Math.floor(index / pairs.length) % 2 === 1;
  return {
    deckA: swapped ? pair[1] : pair[0],
    deckB: swapped ? pair[0] : pair[1],
    seat0: index % 2 === 0 ? 'A' : 'B'
  };
}

export function runBenchmark(config: BenchmarkConfig): { summary: BenchmarkSummary; games: BenchGame[] } {
  if (config.decks.length === 0) {
    throw new Error('At least one deck is required');
  }
  registerCardSets();
  const started = Date.now();
  const games: BenchGame[] = [];
  const indexes = config.only !== undefined
    ? config.only
    : Array.from({ length: config.games }, (_, i) => i);

  for (const index of indexes) {
    const game = runOne(config, index);
    games.push(game);
    if (config.onGame) {
      config.onGame(game);
    }
  }

  const summary = summarize(games, config.seed, config.sideA.name, config.sideB.name);
  summary.durationMs = Date.now() - started;
  return { summary, games };
}

function runOne(config: BenchmarkConfig, index: number): BenchGame {
  const { deckA, deckB, seat0 } = scheduleGame(index, config.decks);
  const seed = deriveSeed(config.seed, index);
  const a = { name: `A:${config.sideA.name}`, bot: config.sideA.create(`A:${config.sideA.name}`), deck: deckA.cards };
  const b = { name: `B:${config.sideB.name}`, bot: config.sideB.create(`B:${config.sideB.name}`), deck: deckB.cards };
  const seats: [typeof a, typeof b] = seat0 === 'A' ? [a, b] : [b, a];
  const result = playGame(seats, seed, config.limits, new Rules());

  const sideOf = (seat: number | undefined): Side | undefined => {
    if (seat === undefined) {
      return undefined;
    }
    return (seat === 0) === (seat0 === 'A') ? 'A' : 'B';
  };

  return {
    ...result,
    index,
    deckA: deckA.name,
    deckB: deckB.name,
    seat0,
    winnerSide: sideOf(result.winnerSeat),
    firstSide: sideOf(result.firstSeat)
  };
}

function emptyWin(): WinStats {
  return { games: 0, wins: 0, losses: 0, other: 0, winRate: 0 };
}

function record(stats: WinStats, won: boolean | undefined): void {
  stats.games += 1;
  if (won === true) {
    stats.wins += 1;
  } else if (won === false) {
    stats.losses += 1;
  } else {
    stats.other += 1;
  }
  stats.winRate = stats.games === 0 ? 0 : stats.wins / stats.games;
}

function lengthStats(values: number[]): LengthStats {
  if (values.length === 0) {
    return { avg: 0, max: 0, min: 0 };
  }
  const sum = values.reduce((s, v) => s + v, 0);
  return { avg: sum / values.length, max: Math.max(...values), min: Math.min(...values) };
}

/** Aggregates per-game results. Pure: depends only on its inputs. */
export function summarize(games: BenchGame[], seed: number, sideA: string, sideB: string): BenchmarkSummary {
  const outcomes: { [K in GameOutcome]: number } = {
    'win': 0, 'draw': 0, 'no-winner': 0, 'guard': 0, 'stalled': 0, 'illegal-moves': 0, 'error': 0
  };
  const summary: BenchmarkSummary = {
    games: games.length,
    seed,
    sideA,
    sideB,
    outcomes,
    guardReasons: {},
    endReasons: {},
    side: { A: emptyWin(), B: emptyWin() },
    decks: {},
    matchups: {},
    firstPlayer: emptyWin(),
    turns: lengthStats(games.map(g => g.turns)),
    actions: lengthStats(games.map(g => g.actions)),
    invalidMoves: 0,
    invalidMoveMessages: {},
    errors: [],
    problemGames: [],
    durationMs: 0
  };

  for (const g of games) {
    outcomes[g.outcome] += 1;
    const decided = g.winnerSide !== undefined;
    const won = (side: Side) => decided ? g.winnerSide === side : undefined;

    record(summary.side.A, won('A'));
    record(summary.side.B, won('B'));

    for (const side of ['A', 'B'] as Side[]) {
      const deck = side === 'A' ? g.deckA : g.deckB;
      const opp = side === 'A' ? g.deckB : g.deckA;
      summary.decks[deck] = summary.decks[deck] || emptyWin();
      record(summary.decks[deck], won(side));
      const key = `${deck} vs ${opp}`;
      summary.matchups[key] = summary.matchups[key] || emptyWin();
      record(summary.matchups[key], won(side));
    }

    if (decided && g.firstSide !== undefined) {
      record(summary.firstPlayer, g.winnerSide === g.firstSide);
    }

    summary.invalidMoves += g.invalidMoves[0] + g.invalidMoves[1];
    for (const [message, count] of Object.entries(g.invalidMoveMessages)) {
      summary.invalidMoveMessages[message] = (summary.invalidMoveMessages[message] || 0) + count;
    }

    for (const reason of g.endReasons) {
      summary.endReasons[reason] = (summary.endReasons[reason] || 0) + 1;
    }

    if (g.guardReason !== undefined) {
      summary.guardReasons[g.guardReason] = (summary.guardReasons[g.guardReason] || 0) + 1;
    }

    if (g.error !== undefined) {
      const seat0Side = g.seat0;
      const side = g.error.seat === undefined ? undefined
        : ((g.error.seat === 0) === (seat0Side === 'A') ? 'A' : 'B') as Side;
      summary.errors.push({
        index: g.index, seed: g.seed, deckA: g.deckA, deckB: g.deckB,
        message: g.error.message, source: g.error.source, turn: g.error.turn,
        phase: g.error.phase, action: g.error.action, side, stack: g.error.stack
      });
    }

    if (g.outcome !== 'win' && g.outcome !== 'draw') {
      let detail: string | undefined;
      if (g.outcome === 'guard') {
        detail = g.guardReason;
      } else if (g.outcome === 'error' && g.error) {
        detail = g.error.message;
      } else if (g.outcome === 'illegal-moves') {
        detail = `seat ${g.illegalMovesSeat}`;
      } else if (g.outcome === 'stalled') {
        detail = `phase ${g.finalPhase}`;
      }
      summary.problemGames.push({
        index: g.index, seed: g.seed, outcome: g.outcome, deckA: g.deckA, deckB: g.deckB,
        turns: g.turns, actions: g.actions, detail
      });
    }
  }

  return summary;
}
