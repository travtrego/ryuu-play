import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Drowzee } from '../../../src/base-sets/set-base/drowzee';
import { TestUtils } from '../../test-utils';

describe('Drowzee BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Drowzee()],
      [CardType.PSYCHIC, CardType.PSYCHIC],
    );
  });

  // Pound (10)
  it('Should use Pound', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pound'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Confuse Ray (10) - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Confuse Ray - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Confuse Ray - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

});
