import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Tentacruel } from '../../../src/base-sets/set-fossil/tentacruel';
import { TestUtils } from '../../test-utils';

describe('Tentacruel FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Tentacruel()],
      [CardType.WATER, CardType.WATER]
    );
  });

  // Supersonic - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Supersonic - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Supersonic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Supersonic - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Supersonic'));

    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Jellyfish Sting (10) - The Defending Pokémon is now Poisoned.
  it('Should use Jellyfish Sting', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Jellyfish Sting'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(20); // 10 + 10 Poison between turns
  });
});
