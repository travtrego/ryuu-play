import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Natu } from '../../../src/ex-sets/set-sandstorm/natu';
import { TestUtils } from '../../test-utils';

describe('Natu SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Natu()], [CardType.PSYCHIC]);
  });

  // Peck (10)
  it('Should use Peck', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Peck'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Soothing Wave - Each Defending Pokémon is now Asleep.
  it('Should use Soothing Wave', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the Asleep check between turns
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Soothing Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });
});
