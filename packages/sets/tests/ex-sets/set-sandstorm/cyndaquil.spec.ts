import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Cyndaquil } from '../../../src/ex-sets/set-sandstorm/cyndaquil';
import { TestUtils } from '../../test-utils';

describe('Cyndaquil SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Cyndaquil()], [CardType.FIRE]);
  });

  // Tackle (10)
  it('Should use Tackle', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tackle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Singe - Flip a coin. If heads, the Defending Pokémon is now Burned.
  it('Should use Singe - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    // heads for Singe, heads for the burn check between turns
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Singe'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Singe - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Singe'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(0);
  });
});
