import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Paras } from '../../../src/base-sets/set-jungle/paras';
import { TestUtils } from '../../test-utils';

describe('Paras JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Paras()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Scratch (20)
  it('Should use Scratch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Spore - The Defending Pokémon is now Asleep.
  it('Should use Spore', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the between-turns sleep check
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });
});
