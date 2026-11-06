import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Meowth } from '../../../src/base-sets/set-jungle/meowth';
import { TestUtils } from '../../test-utils';

describe('Meowth JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Meowth()],
      [CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Pay Day (10) - Flip a coin. If heads, draw a card.
  it('Should use Pay Day - heads, draws a card', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const topCard = player.deck.cards[0];
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Pay Day'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.hand.cards).toEqual([topCard]);
    expect(player.deck.cards.length).toEqual(49);
  });

  it('Should use Pay Day - tails, no card drawn', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Pay Day'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(50);
  });
});
