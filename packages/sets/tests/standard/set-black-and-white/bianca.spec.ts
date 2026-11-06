import { GameMessage, PlayCardAction, Simulator } from '@ptcg/common';

import { Bianca } from '../../../src/standard/set-black-and-white/bianca';
import { TestUtils } from '../../test-utils';

describe('Bianca EPO', () => {
  let sim: Simulator;
  let trainerCard: Bianca;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Bianca();
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

  // Draw cards until you have 6 cards in your hand.
  it('Should draw until the hand holds 6 cards', () => {
    const { player } = TestUtils.getAll(sim);

    expect(playCard()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    // 2 kept + 4 drawn
    expect(player.hand.cards.length).toEqual(6);
    expect(player.deck.cards.length).toEqual(16);
    expect(player.supporter.cards).toEqual([trainerCard]);
  });

  it('Should not be playable with 6 cards already in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(6)];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards.length).toEqual(7);
  });

  it('Should not be playable with an empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});
