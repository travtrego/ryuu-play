import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Kangaskhan } from '../../../src/base-sets/set-jungle/kangaskhan';
import { TestUtils } from '../../test-utils';

describe('Kangaskhan JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Kangaskhan()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Fetch - Draw a card.
  it('Should use Fetch and draw a card', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const topCard = player.deck.cards[0];

    sim.dispatch(new AttackAction(1, 'Fetch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([topCard]);
    expect(player.deck.cards.length).toEqual(49);
    expect(opponent.active.damage).toEqual(0);
  });

  // Comet Punch (20x) - Flip 4 coins. This attack does 20 damage times the number of heads.
  it('Should use Comet Punch - 4 heads', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Comet Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });

  it('Should use Comet Punch - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false, false, true]);

    sim.dispatch(new AttackAction(1, 'Comet Punch'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Comet Punch - 4 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Comet Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});
