import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Gloom } from '../../../src/base-sets/set-jungle/gloom';
import { TestUtils } from '../../test-utils';

describe('Gloom JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Gloom()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Poisonpowder - The Defending Pokémon is now Poisoned.
  it('Should use Poisonpowder', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Poisonpowder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // Poison between turns
    expect(opponent.active.damage).toEqual(10);
  });

  // Foul Odor (20) - Both the Defending Pokémon and Gloom are now Confused (after doing damage).
  it('Should use Foul Odor', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Foul Odor'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(player.active.damage).toEqual(0);
  });
});
