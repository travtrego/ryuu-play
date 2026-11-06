import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Ivysaur } from '../../../src/base-sets/set-base/ivysaur';
import { TestUtils } from '../../test-utils';

describe('Ivysaur BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Ivysaur()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS],
    );
  });

  // Vine Whip (30)
  it('Should use Vine Whip', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Vine Whip'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Poisonpowder (20) - The Defending Pokémon is now Poisoned.
  it('Should use Poisonpowder - Defending Pokémon is Poisoned', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Poisonpowder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    // 20 damage + 10 Poison damage between turns
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

});
