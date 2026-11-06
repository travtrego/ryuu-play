import {
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { ProfessorOak } from '../../../src/base-sets/set-base/professor-oak';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Professor Oak BS', () => {
  let sim: Simulator;
  let trainerCard: ProfessorOak;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ProfessorOak();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should discard the hand and draw 7 cards', () => {
    const { player } = TestUtils.getAll(sim);
    const x = new TestCard();
    const y = new TestCard();
    player.hand.cards = [trainerCard, x, y];
    const top7 = player.deck.cards.slice(0, 7);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(7);
    top7.forEach(c => expect(player.hand.cards.includes(c)).toBeTrue());
    expect(player.deck.cards.length).toEqual(43);
    expect(player.discard.cards.length).toEqual(3);
    [trainerCard, x, y].forEach(c => expect(player.discard.cards.includes(c)).toBeTrue());
  });

  it('Should draw only the remaining cards when the deck has fewer than 7', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new TestCard()];
    player.deck.cards = TestUtils.makeTestCards(3);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(3);
    expect(player.deck.cards.length).toEqual(0);
    expect(player.discard.cards.length).toEqual(2);
  });
});
