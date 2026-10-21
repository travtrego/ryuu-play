import { BotFlipMode } from '@ptcg/common';
import { BenchGame, BenchmarkSummary, runBenchmark, scheduleGame, summarize } from './benchmark';
import { benchDecks, findDeck } from './decks';
import { botVariants, findBotVariant, simpleBotVariant } from './bot-variants';
import { checkThresholds, parseArgs } from './cli';
import { registerCardSets } from './card-setup';
import { DeckAnalyser } from '@ptcg/common';
import { formatSummary } from './report';

function game(partial: Partial<BenchGame>): BenchGame {
  return {
    seed: 0, outcome: 'win', turns: 10, actions: 50, arbiterActions: 5,
    invalidMoves: [0, 0], invalidMoveMessages: {}, prizesLeft: [0, 3], endReasons: ['prizes'],
    finalPhase: 'FINISHED', durationMs: 1, index: 0, deckA: 'x', deckB: 'y', seat0: 'A',
    ...partial
  };
}

function withoutTiming(s: BenchmarkSummary): BenchmarkSummary {
  return { ...s, durationMs: 0 };
}

describe('decks and variants', () => {

  beforeAll(() => registerCardSets());

  it('every benchmark deck is a valid 60-card deck of defined cards', () => {
    for (const deck of benchDecks) {
      const analyser = new DeckAnalyser(deck.cards);
      expect(analyser.cardNames.length).withContext(deck.name).toBe(60);
      expect(analyser.isValid()).withContext(deck.name).toBe(true);
    }
  });

  it('registerCardSets can be called more than once', () => {
    expect(() => registerCardSets()).not.toThrow();
  });

  it('rejects unknown decks and variants', () => {
    expect(() => findDeck('nope')).toThrowError(/Unknown deck/);
    expect(() => findBotVariant('nope')).toThrowError(/Unknown bot variant/);
    expect(botVariants.map(v => v.name)).toContain('default');
  });

  it('rejects SimpleBot options whose look-ahead uses Math.random', () => {
    expect(() => simpleBotVariant('r', 'random', {
      arbiter: { flipMode: BotFlipMode.RANDOM, shuffleMode: 0, flipResults: [] }
    })).toThrowError(/not deterministic/);
  });

});

describe('scheduleGame', () => {

  it('plays a full round robin, then swaps decks, and alternates seats', () => {
    const decks = benchDecks.slice(0, 4); // 6 pairs
    const first = Array.from({ length: 6 }, (_, i) => scheduleGame(i, decks));
    const pairs = first.map(g => [g.deckA.name, g.deckB.name].sort().join('|'));
    expect(new Set(pairs).size).toBe(6);
    for (let i = 0; i < 6; i++) {
      const swapped = scheduleGame(i + 6, decks);
      expect(swapped.deckA).toBe(first[i].deckB);
      expect(swapped.deckB).toBe(first[i].deckA);
    }
    expect(scheduleGame(0, decks).seat0).toBe('A');
    expect(scheduleGame(1, decks).seat0).toBe('B');
  });

  it('plays mirrors when there is a single deck', () => {
    const s = scheduleGame(3, [benchDecks[0]]);
    expect(s.deckA).toBe(benchDecks[0]);
    expect(s.deckB).toBe(benchDecks[0]);
  });

});

describe('summarize', () => {

  it('aggregates outcomes, sides, decks, lengths and problems', () => {
    const games: BenchGame[] = [
      game({ index: 0, winnerSide: 'A', firstSide: 'A', turns: 10, actions: 40, deckA: 'x', deckB: 'y' }),
      game({ index: 1, winnerSide: 'B', firstSide: 'A', turns: 20, actions: 60, deckA: 'y', deckB: 'x',
        invalidMoves: [2, 1], invalidMoveMessages: { 'PlayCardAction: X': 3 }, endReasons: ['no-active'] }),
      game({ index: 2, winnerSide: 'A', firstSide: 'B', turns: 30, actions: 80, deckA: 'x', deckB: 'y',
        endReasons: ['deck-out'] }),
      game({ index: 3, outcome: 'guard', guardReason: 'max-turns', turns: 201, actions: 900, endReasons: [] }),
      game({ index: 4, outcome: 'draw', turns: 40, actions: 100, endReasons: ['prizes', 'no-active'] }),
      game({ index: 5, outcome: 'error', turns: 3, actions: 7, endReasons: [], seat0: 'B',
        error: { source: 'dispatch', message: 'TypeError: x', turn: 3, phase: 'PLAYER_TURN', seat: 0 } })
    ];
    const s = summarize(games, 9, 'default', 'other');

    expect(s.games).toBe(6);
    expect(s.seed).toBe(9);
    expect(s.outcomes).toEqual({ 'win': 3, 'draw': 1, 'no-winner': 0, 'guard': 1, 'stalled': 0,
      'illegal-moves': 0, 'error': 1 });
    expect(s.side.A).toEqual({ games: 6, wins: 2, losses: 1, other: 3, winRate: 2 / 6 });
    expect(s.side.B).toEqual({ games: 6, wins: 1, losses: 2, other: 3, winRate: 1 / 6 });
    // x won games 0 and 2 (as side A) and game 1 (as side B); 3 more games without a winner.
    expect(s.decks['x']).toEqual({ games: 6, wins: 3, losses: 0, other: 3, winRate: 3 / 6 });
    expect(s.decks['y']).toEqual({ games: 6, wins: 0, losses: 3, other: 3, winRate: 0 });
    expect(s.matchups['x vs y']).toEqual({ games: 6, wins: 3, losses: 0, other: 3, winRate: 3 / 6 });
    expect(s.matchups['y vs x']).toEqual({ games: 6, wins: 0, losses: 3, other: 3, winRate: 0 });
    expect(s.firstPlayer).toEqual({ games: 3, wins: 1, losses: 2, other: 0, winRate: 1 / 3 });
    expect(s.turns).toEqual({ avg: (10 + 20 + 30 + 201 + 40 + 3) / 6, min: 3, max: 201 });
    expect(s.actions.max).toBe(900);
    expect(s.invalidMoves).toBe(3);
    expect(s.invalidMoveMessages).toEqual({ 'PlayCardAction: X': 3 });
    expect(s.guardReasons).toEqual({ 'max-turns': 1 });
    expect(s.endReasons).toEqual({ 'prizes': 2, 'no-active': 2, 'deck-out': 1 });
    expect(s.errors.length).toBe(1);
    expect(s.errors[0].side).toBe('B');
    expect(s.problemGames.map(p => [p.index, p.outcome, p.detail])).toEqual([
      [3, 'guard', 'max-turns'],
      [5, 'error', 'TypeError: x']
    ]);
    expect(formatSummary(s)).toContain('unexpected errors: 1');
  });

  it('handles an empty run', () => {
    const s = summarize([], 1, 'a', 'b');
    expect(s.games).toBe(0);
    expect(s.turns).toEqual({ avg: 0, min: 0, max: 0 });
  });

});

describe('runBenchmark', () => {

  const config = () => ({
    games: 3,
    seed: 11,
    sideA: findBotVariant('default'),
    sideB: findBotVariant('default'),
    decks: [findDeck('bs-fighting'), findDeck('bw-zekrom'), findDeck('bs-water')]
  });

  it('is deterministic for a given seed', () => {
    const a = runBenchmark(config());
    const b = runBenchmark(config());
    expect(withoutTiming(b.summary)).toEqual(withoutTiming(a.summary));
    expect(b.games.map(g => ({ ...g, durationMs: 0 }))).toEqual(a.games.map(g => ({ ...g, durationMs: 0 })));
    expect(a.summary.games).toBe(3);
    expect(a.summary.outcomes.error).toBe(0);
  });

  it('replays a single game of a run with --only', () => {
    const full = runBenchmark(config());
    const one = runBenchmark({ ...config(), only: [2] });
    expect(one.games.length).toBe(1);
    expect({ ...one.games[0], durationMs: 0 }).toEqual({ ...full.games[2], durationMs: 0 });
  });

});

describe('cli', () => {

  it('parses options', () => {
    const o = parseArgs(['--games', '20', '--seed', '3', '--bot-b', 'no-retreat', '--decks', 'bs-fire,bs-water',
      '--max-turns', '50', '--json', '--max-errors', '0', '--only', '1,2']);
    expect(o.games).toBe(20);
    expect(o.seed).toBe(3);
    expect(o.botA).toBe('default');
    expect(o.botB).toBe('no-retreat');
    expect(o.decks).toEqual(['bs-fire', 'bs-water']);
    expect(o.limits).toEqual({ maxTurns: 50 });
    expect(o.json).toBe(true);
    expect(o.thresholds).toEqual({ errors: 0 });
    expect(o.only).toEqual([1, 2]);
    expect(parseArgs(['--json', 'out.json']).json).toBe('out.json');
    expect(() => parseArgs(['--games', '-1'])).toThrowError(/non-negative integer/);
    expect(() => parseArgs(['--bogus'])).toThrowError(/Unknown option/);
  });

  it('fails thresholds only when exceeded', () => {
    const s = summarize([
      game({ outcome: 'guard', guardReason: 'max-actions' }),
      game({ outcome: 'stalled' })
    ], 1, 'a', 'b');
    expect(checkThresholds(s, {})).toEqual([]);
    expect(checkThresholds(s, { guard: 1, stalled: 1, errors: 0 })).toEqual([]);
    expect(checkThresholds(s, { guard: 0, stalled: 0 })).toEqual([
      'games stopped by loop guard: 1 > allowed 0',
      'stalled games: 1 > allowed 0'
    ]);
  });

});
