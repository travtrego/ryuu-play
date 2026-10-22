import {
  GameMessage,
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { Gambler } from '../../../src/base-sets/set-fossil/gambler';
import { TestUtils } from '../../test-utils';

describe('Gambler FO', () => {
  let sim: Simulator;
  let trainerCard: Gambler;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Gambler();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(3)];
    player.deck.cards = TestUtils.makeTestCards(20);
  });

  // Shuffle your hand into your deck. Flip a coin. If heads, draw 8 cards. If tails, draw 1 card.
  it('Should shuffle hand into deck and draw 8 cards on heads', () => {
    const { player } = TestUtils.getAll(sim);
    const oldHand = player.hand.cards.filter(c => c !== trainerCard);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(8);
    expect(player.deck.cards.length).toEqual(23 - 8);
    expect(player.discard.cards).toEqual([trainerCard]);
    // The old hand went into the deck (some may have been drawn again)
    oldHand.forEach(c => {
      expect(player.deck.cards.includes(c) || player.hand.cards.includes(c)).toBeTrue();
    });
  });

  it('Should shuffle hand into deck and draw 1 card on tails', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(1);
    expect(player.deck.cards.length).toEqual(22);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable with an empty hand and an empty deck', () => {
    sim.store.state.players[0].hand.cards = [trainerCard];
    sim.store.state.players[0].deck.cards = [];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});
