import { GameMessage, PlayCardAction, Simulator } from '@ptcg/common';

import { ProfessorJuniper } from '../../../src/standard/set-black-and-white/professor-juniper';
import { TestUtils } from '../../test-utils';

describe('Professor Juniper BW', () => {
  let sim: Simulator;
  let trainerCard: ProfessorJuniper;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ProfessorJuniper();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(3)];
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

  // Discard your hand and draw 7 cards.
  it('Should discard the hand and draw 7 cards', () => {
    const { player } = TestUtils.getAll(sim);
    const oldHand = player.hand.cards.filter(c => c !== trainerCard);

    expect(playCard()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(7);
    expect(player.deck.cards.length).toEqual(13);
    oldHand.forEach(c => expect(player.discard.cards).toContain(c));
    expect(player.supporter.cards).toEqual([trainerCard]);
  });

  it('Should not be playable with an empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});
