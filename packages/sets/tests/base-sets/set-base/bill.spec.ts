import {
  CardType,
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { Bill } from '../../../src/base-sets/set-base/bill';
import { TestUtils } from '../../test-utils';

describe('Bill BS', () => {
  let sim: Simulator;
  let trainerCard: Bill;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Bill();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should draw 2 cards', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(2);
    expect(player.deck.cards.length).toEqual(48);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should draw the top 2 cards of the deck', () => {
    const { player } = TestUtils.getAll(sim);
    const [fire, water, grass] = TestUtils.makeEnergies([CardType.FIRE, CardType.WATER, CardType.GRASS]);
    player.deck.cards = [fire, water, grass];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(player.hand.cards).toEqual([fire, water]);
    expect(player.deck.cards).toEqual([grass]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});
