import { GameMessage, PlayCardAction, Simulator } from '@ptcg/common';

import { Cheren } from '../../../src/standard/set-black-and-white/cheren';
import { TestUtils } from '../../test-utils';

describe('Cheren EPO', () => {
  let sim: Simulator;
  let trainerCard: Cheren;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Cheren();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(2)];
    player.deck.cards = TestUtils.makeTestCards(20);
  });

  function playCard(): string {
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Draw 3 cards.
  it('Should draw 3 cards', () => {
    const { player } = TestUtils.getAll(sim);

    expect(playCard()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    // 2 kept + 3 drawn
    expect(player.hand.cards.length).toEqual(5);
    expect(player.deck.cards.length).toEqual(17);
    expect(player.supporter.cards).toEqual([trainerCard]);
  });

  it('Should not be playable with an empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});
