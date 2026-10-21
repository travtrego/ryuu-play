import { Action, BotAi, BotAiFactory, ResolvePromptAction, State } from '@ptcg/common';
import { SimpleBot } from '@ptcg/simple-bot';
import { registerCardSets } from './card-setup';
import { findDeck } from './decks';
import { GameResult, GameSeat, playGame } from './headless-game';

class FakeBot extends BotAiFactory {
  constructor(private decide: (playerId: number, state: State) => Action | undefined) {
    super('fake');
  }
  public createBotAi(playerId: number): BotAi {
    return { decodeNextAction: state => this.decide(playerId, state) };
  }
}

function seats(botA: BotAiFactory, botB: BotAiFactory, deckA = 'bs-fire', deckB = 'bs-water'): [GameSeat, GameSeat] {
  return [
    { name: 'p1', bot: botA, deck: findDeck(deckA).cards },
    { name: 'p2', bot: botB, deck: findDeck(deckB).cards }
  ];
}

/** Wall-clock duration is the only field allowed to differ between identical runs. */
function withoutTiming(result: GameResult): GameResult {
  return { ...result, durationMs: 0 };
}

describe('playGame', () => {

  beforeAll(() => {
    registerCardSets();
  });

  it('plays a complete SimpleBot vs SimpleBot game to a result', () => {
    const result = playGame(seats(new SimpleBot('a'), new SimpleBot('b')), 1);
    expect(['win', 'draw']).toContain(result.outcome);
    expect(result.turns).toBeGreaterThan(0);
    expect(result.actions).toBeGreaterThan(0);
    expect(result.arbiterActions).toBeGreaterThan(0);
    expect(result.finalPhase).toBe('FINISHED');
    expect(result.endReasons.length).toBeGreaterThan(0);
    if (result.outcome === 'win') {
      expect([0, 1]).toContain(result.winnerSeat as number);
    }
    expect([0, 1]).toContain(result.firstSeat as number);
  });

  it('is deterministic: same seed, decks and bots give the same game', () => {
    const run = (seed: number) => withoutTiming(
      playGame(seats(new SimpleBot('a'), new SimpleBot('b'), 'bw-zekrom', 'bs-psychic'), seed));
    const first = run(77);
    const second = run(77);
    expect(second).toEqual(first);
  });

  it('does not use Math.random anywhere in a game', () => {
    const spy = spyOn(Math, 'random').and.callThrough();
    playGame(seats(new SimpleBot('a'), new SimpleBot('b'), 'bs-lightning', 'bw-emboar'), 5);
    expect(spy).not.toHaveBeenCalled();
  });

  describe('loop guard', () => {

    it('stops a game at maxActions', () => {
      const result = playGame(seats(new SimpleBot('a'), new SimpleBot('b')), 1, { maxActions: 5 });
      expect(result.outcome).toBe('guard');
      expect(result.guardReason).toBe('max-actions');
      expect(result.actions).toBe(5);
    });

    it('stops a game at maxTurns', () => {
      const result = playGame(seats(new SimpleBot('a'), new SimpleBot('b')), 1, { maxTurns: 2 });
      // Seed 1 bs-fire vs bs-water lasts well beyond two turns (see the first spec).
      expect(result.outcome).toBe('guard');
      expect(result.guardReason).toBe('max-turns');
      expect(result.turns).toBe(3);
    });

    it('stops a bot that keeps acting within one turn', () => {
      const result = playGame(seats(new SimpleBot('a'), new SimpleBot('b')), 1, { maxActionsPerTurn: 1 });
      expect(result.outcome).toBe('guard');
      expect(result.guardReason).toBe('max-actions-per-turn');
    });

    it('records a game where nobody acts as stalled instead of hanging', () => {
      const idle = new FakeBot(() => undefined);
      const result = playGame(seats(idle, idle), 1);
      expect(result.outcome).toBe('stalled');
      expect(result.finalPhase).toBe('SETUP');
      expect(result.actions).toBe(0);
    });

  });

  it('aborts a bot that keeps sending rejected actions, like the server does', () => {
    // A ResolvePromptAction for a prompt id that does not exist is always rejected with a GameError.
    const bad = new FakeBot(() => new ResolvePromptAction(9999, null));
    const result = playGame(seats(bad, new SimpleBot('b')), 1, { maxInvalidMoves: 15 });
    expect(result.outcome).toBe('illegal-moves');
    expect(result.illegalMovesSeat).toBe(0);
    expect(result.invalidMoves).toEqual([16, 0]);
    expect(Object.keys(result.invalidMoveMessages)).toEqual(['ResolvePromptAction: ILLEGAL_ACTION']);
    expect(result.finalPhase).toBe('FINISHED');
  });

  it('records an exception thrown by a bot as an error', () => {
    const crashing = new FakeBot(() => { throw new TypeError('boom'); });
    const result = playGame(seats(new SimpleBot('a'), crashing), 1);
    expect(result.outcome).toBe('error');
    expect(result.error!.source).toBe('decode');
    expect(result.error!.message).toBe('TypeError: boom');
  });

  it('records an invalid deck as a setup error', () => {
    const s = seats(new SimpleBot('a'), new SimpleBot('b'));
    s[1].deck = s[1].deck.slice(0, 59);
    const result = playGame(s, 1);
    expect(result.outcome).toBe('error');
    expect(result.error!.source).toBe('setup');
    expect(result.error!.message).toBe('GameError: INVALID_DECK');
  });

});
