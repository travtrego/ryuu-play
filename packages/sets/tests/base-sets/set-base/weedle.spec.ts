import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Weedle } from '../../../src/base-sets/set-base/weedle';
import { TestUtils } from '../../test-utils';

describe('Weedle BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Weedle()],
      [CardType.GRASS],
    );
  });

  // Poison Sting (10) - Flip a coin. If heads, the Defending Pokémon is now Poisoned.
  it('Should use Poison Sting and poison on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Poison Sting'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 10 attack damage + 10 Poison damage between turns
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Poison Sting and not poison on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Poison Sting'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(10);
  });
});
