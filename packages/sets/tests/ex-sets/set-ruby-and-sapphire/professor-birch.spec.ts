import {
  GameMessage,
  PlayCardAction,
  Simulator,
  TrainerCard,
} from '@ptcg/common';

import { ProfessorBirch } from '../../../src/ex-sets/set-ruby-and-sapphire/professor-birch';
import { TestUtils } from '../../test-utils';

describe('Professor Birch RS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ProfessorBirch();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  function play(): string {
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Draw cards from your deck until you have 6 cards in your hand.
  it('Should play Professor Birch - draw up to 6 cards', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards.push(...TestUtils.makeTestCards(2));

    expect(play()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(6);
    expect(player.deck.cards.length).toEqual(46);
    expect(player.supporter.cards).toEqual([trainerCard]);
  });

  it('Should play Professor Birch - fewer cards in deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = TestUtils.makeTestCards(2);

    expect(play()).toEqual('');

    expect(player.hand.cards.length).toEqual(2);
    expect(player.deck.cards.length).toEqual(0);
  });

  it('Should not play Professor Birch - already 6 cards in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards.push(...TestUtils.makeTestCards(6));

    expect(play()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards.length).toEqual(7);
  });

  it('Should not play Professor Birch - empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(play()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

});
