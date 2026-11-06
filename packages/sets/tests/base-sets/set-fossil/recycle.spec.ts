import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Recycle } from '../../../src/base-sets/set-fossil/recycle';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Recycle FO', () => {
  let sim: Simulator;
  let trainerCard: Recycle;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Recycle();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Flip a coin. If heads, put a card in your discard pile on top of your deck.
  it('Should put a card from the discard pile on top of the deck on heads', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const discarded = new TestPokemon();
    const other = new TestPokemon();
    player.discard.cards = [other, discarded];
    const deckSize = player.deck.cards.length;
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    const prompt = prompts.find(p => p.type === 'Choose cards');
    expect(prompt).toEqual(jasmine.objectContaining({
      playerId: player.id,
      cards: player.discard,
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));

    sim.dispatch(new ResolvePromptAction(prompt!.id, [discarded]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.deck.cards.length).toEqual(deckSize + 1);
    expect(player.deck.cards[0]).toBe(discarded);
    expect(player.discard.cards).toEqual([other, trainerCard]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should do nothing but discard Recycle on tails', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const discarded = new TestPokemon();
    player.discard.cards = [discarded];
    const deckTop = player.deck.cards[0];
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts.some(p => p.type === 'Choose cards')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.deck.cards[0]).toBe(deckTop);
    expect(player.discard.cards).toEqual([discarded, trainerCard]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should not be playable with an empty discard pile', () => {
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});
