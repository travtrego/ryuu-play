import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Weepinbell } from '../../../src/base-sets/set-jungle/weepinbell';
import { TestUtils } from '../../test-utils';

describe('Weepinbell JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Weepinbell()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Poisonpowder (10) - Flip a coin. If heads, the Defending Pokémon is now Poisoned.
  it('Should use Poisonpowder - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Poisonpowder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 10 damage + 10 Poison between turns
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Poisonpowder - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Poisonpowder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(10);
  });

  // Razor Leaf (30)
  it('Should use Razor Leaf', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Razor Leaf'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});
