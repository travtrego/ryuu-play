import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Vulpix } from '../../../src/base-sets/set-base/vulpix';
import { TestUtils } from '../../test-utils';

describe('Vulpix BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Vulpix()],
      [CardType.FIRE, CardType.FIRE],
    );
  });

  // Confuse Ray (10) - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Confuse Ray and confuse on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Confuse Ray and not confuse on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});
