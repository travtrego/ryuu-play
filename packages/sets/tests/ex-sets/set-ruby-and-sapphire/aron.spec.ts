import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Aron } from '../../../src/ex-sets/set-ruby-and-sapphire/aron';
import { TestUtils } from '../../test-utils';

describe('Aron RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Aron()], [CardType.METAL, CardType.COLORLESS]);
  });

  // Rollout (10)
  it('Should use Rollout', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rollout'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Double Stab (20x) - Flip 2 coins. This attack does 20 damage times the number of heads.
  it('Should use Double Stab - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Stab'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Double Stab - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Double Stab'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Double Stab - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Stab'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
