import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Tangela } from '../../../src/base-sets/set-base/tangela';
import { TestUtils } from '../../test-utils';

describe('Tangela BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Tangela()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS],
    );
  });

  // Bind (20) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Bind and paralyze on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Bind'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Bind and not paralyze on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Bind'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Poisonpowder (20) - The Defending Pokémon is now Poisoned.
  it('Should use Poisonpowder and poison the Defending Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Poisonpowder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 20 attack damage + 10 Poison damage between turns
    expect(opponent.active.damage).toEqual(30);
  });
});
