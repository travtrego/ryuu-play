import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Jigglypuff } from '../../../src/base-sets/set-jungle/jigglypuff';
import { TestUtils } from '../../test-utils';

describe('Jigglypuff JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Jigglypuff()],
      [CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Lullaby - The Defending Pokémon is now Asleep.
  it('Should use Lullaby', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the between-turns sleep check
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Lullaby'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  // Pound (20)
  it('Should use Pound', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pound'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});
