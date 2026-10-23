import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Aron } from '../../../src/ex-sets/set-sandstorm/aron';
import { TestUtils } from '../../test-utils';

describe('Aron SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Aron()], [CardType.METAL, CardType.COLORLESS]);
  });

  // Steel Headbutt (20+) - Flip a coin. If heads, this attack does 20 damage plus 20 more damage.
  it('Should use Steel Headbutt - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Steel Headbutt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Steel Headbutt - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Steel Headbutt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
