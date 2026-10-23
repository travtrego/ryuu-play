import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Cacnea2 } from '../../../src/ex-sets/set-sandstorm/cacnea-2';
import { TestUtils } from '../../test-utils';

describe('Cacnea SS-2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Cacnea2()], [CardType.GRASS]);
  });

  // Poison Sting (10) - Flip a coin. If heads, the Defending Pokémon is now Poisoned.
  it('Should use Poison Sting - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Poison Sting'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 10 damage + 10 poison
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Poison Sting - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Poison Sting'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(10);
  });
});
