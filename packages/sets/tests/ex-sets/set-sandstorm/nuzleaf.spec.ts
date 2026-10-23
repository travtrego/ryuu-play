import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Nuzleaf } from '../../../src/ex-sets/set-sandstorm/nuzleaf';
import { TestUtils } from '../../test-utils';

describe('Nuzleaf SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Nuzleaf()],
      [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Steady Punch (20+) - Flip a coin. If heads, this attack does 20 damage plus 10 more damage.
  it('Should use Steady Punch - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Steady Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Steady Punch - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Steady Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Razor Leaf (40)
  it('Should use Razor Leaf', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Razor Leaf'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });
});
