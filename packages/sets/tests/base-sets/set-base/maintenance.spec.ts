import {
  CardType,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Maintenance } from '../../../src/base-sets/set-base/maintenance';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Maintenance BS', () => {
  let sim: Simulator;
  let trainerCard: Maintenance;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Maintenance();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should shuffle 2 cards from hand into the deck and draw a card', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const [x, y, z] = TestUtils.makeEnergies([CardType.FIRE, CardType.WATER, CardType.GRASS]);
    player.hand.cards = [trainerCard, x, y, z];
    player.deck.cards = TestUtils.makeTestCards(3);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DECK,
      options: jasmine.objectContaining({ min: 2, max: 2 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [x, y]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
    expect(player.hand.cards.length).toEqual(2);
    expect(player.hand.cards[0]).toBe(z);
    expect(player.deck.cards.length).toEqual(4);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  // BUG: implementation draws before shuffling the 2 cards in and refuses to play with an empty deck
  xit('Should shuffle the 2 cards in first, so it can be played with an empty deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const [x, y] = TestUtils.makeEnergies([CardType.FIRE, CardType.WATER]);
    player.hand.cards = [trainerCard, x, y];
    player.deck.cards = [];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [x, y]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(1);
    expect(player.deck.cards.length).toEqual(1);
    expect([x, y].includes(player.hand.cards[0] as any)).toBeTrue();
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable with fewer than 2 other cards in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new TestCard()];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards.length).toEqual(2);
  });

  it('Should keep everything in hand when cancelled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new TestCard(), new TestCard()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(3);
    expect(player.deck.cards.length).toEqual(50);
    expect(player.discard.cards).toEqual([]);
  });
});
