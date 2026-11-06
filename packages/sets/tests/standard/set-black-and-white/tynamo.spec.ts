import { AttackAction, CardType, Simulator, SpecialCondition } from '@ptcg/common';

import { Tynamo } from '../../../src/standard/set-black-and-white/tynamo';
import { TestUtils } from '../../test-utils';

describe('Tynamo NV', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Tynamo()], [CardType.LIGHTNING]);
  });

  // Thunder Wave (10) - Flip a coin. If heads, the Defending Pokemon is now Paralyzed.
  it('Should use Thunder Wave - heads, Defending Pokemon is Paralyzed', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunder Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Thunder Wave - tails, no Special Condition', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunder Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});
