import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Sandshrew } from '../../../src/ex-sets/set-sandstorm/sandshrew';
import { TestUtils } from '../../test-utils';

describe('Sandshrew SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Sandshrew()], [CardType.FIGHTING]);
  });

  // Poison Needle (10) - Flip a coin. If heads, the Defending Pokémon is now Poisoned.
  it('Should use Poison Needle - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Poison Needle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 10 damage + 10 poison
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Poison Needle - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Poison Needle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(10);
  });
});
