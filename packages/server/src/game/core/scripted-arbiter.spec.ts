import { CoinFlipPrompt, GameMessage, Player, ShuffleDeckPrompt, State } from '@ptcg/common';
import { Arbiter } from './arbiter';
import { ScriptedArbiter } from './scripted-arbiter';

/**
 * The tutorial depends on this Arbiter being completely predictable, and on the
 * ordinary Arbiter being left alone.
 */
describe('ScriptedArbiter (tutorial games)', () => {
  const playerId = 1;
  let state: State;

  beforeEach(() => {
    state = new State();
    const player = new Player();
    player.id = playerId;
    for (let i = 0; i < 10; i++) {
      player.deck.cards.push({ id: i } as never);
    }
    state.players = [player];
  });

  function shuffleResult(arbiter: Arbiter): number[] {
    const action = arbiter.resolvePrompt(state, new ShuffleDeckPrompt(playerId));
    return action!.result as number[];
  }

  function flipResults(arbiter: ScriptedArbiter, count: number): boolean[] {
    const results: boolean[] = [];
    for (let i = 0; i < count; i++) {
      const action = arbiter.resolvePrompt(state, new CoinFlipPrompt(playerId, GameMessage.COIN_FLIP));
      results.push(action!.result as boolean);
    }
    return results;
  }

  it('answers a shuffle with the identity order, leaving the deck alone', () => {
    expect(shuffleResult(new ScriptedArbiter())).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('answers the same way every time, for any deck size', () => {
    const arbiter = new ScriptedArbiter();
    expect(shuffleResult(arbiter)).toEqual(shuffleResult(arbiter));
    expect(ScriptedArbiter.identityOrder(0)).toEqual([]);
    expect(ScriptedArbiter.identityOrder(3)).toEqual([0, 1, 2]);
  });

  it('plays the coin-flip script back in order', () => {
    const arbiter = new ScriptedArbiter([true, false, false, true]);
    expect(flipResults(arbiter, 4)).toEqual([true, false, false, true]);
    expect(arbiter.flipsUsed).toEqual(4);
  });

  // A tutorial must never stall waiting for a flip that was not scripted.
  it('falls back to the default flip once the script runs out', () => {
    const arbiter = new ScriptedArbiter([false]);
    expect(flipResults(arbiter, 3)).toEqual([false, ScriptedArbiter.DEFAULT_FLIP, ScriptedArbiter.DEFAULT_FLIP]);
  });

  it('uses the default flip when there is no script at all', () => {
    expect(flipResults(new ScriptedArbiter(), 2))
      .toEqual([ScriptedArbiter.DEFAULT_FLIP, ScriptedArbiter.DEFAULT_FLIP]);
  });

  it('ignores a prompt for a player who is not in the game', () => {
    expect(new ScriptedArbiter().resolvePrompt(state, new ShuffleDeckPrompt(999))).toBeUndefined();
  });

  // The guard that matters: making tutorial games predictable must not make
  // ordinary games predictable. A real shuffle of 30 cards repeated 5 times
  // returning the identity order every time has odds around 1 in 30!^5.
  describe('the ordinary Arbiter is untouched', () => {

    it('still shuffles, and does not return the identity order', () => {
      const player = state.players[0];
      player.deck.cards = [];
      for (let i = 0; i < 30; i++) {
        player.deck.cards.push({ id: i } as never);
      }
      const arbiter = new Arbiter();
      const identity = ScriptedArbiter.identityOrder(30);

      let anyShuffled = false;
      for (let i = 0; i < 5; i++) {
        const order = shuffleResult(arbiter);
        expect(order.slice().sort((a, b) => a - b)).toEqual(identity);
        if (JSON.stringify(order) !== JSON.stringify(identity)) {
          anyShuffled = true;
        }
      }
      expect(anyShuffled).toBeTrue();
    });

    it('still flips both ways over many flips', () => {
      const arbiter = new Arbiter();
      const seen = new Set<boolean>();
      for (let i = 0; i < 100; i++) {
        seen.add(arbiter.resolvePrompt(state, new CoinFlipPrompt(playerId, GameMessage.COIN_FLIP))!.result as boolean);
      }
      expect(seen.size).toEqual(2);
    });

  });

});
