import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Koffing } from '../../../src/base-sets/set-base/koffing';
import { TestUtils } from '../../test-utils';

describe('Koffing BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Koffing()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Foul Gas (10) - Flip a coin. If heads, the Defending Pokémon is now Poisoned; if tails, it is now Confused.
  it('Should use Foul Gas - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Foul Gas'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 10 damage + 10 Poison damage between turns
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Foul Gas - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Foul Gas'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(opponent.active.damage).toEqual(10);
  });

});
