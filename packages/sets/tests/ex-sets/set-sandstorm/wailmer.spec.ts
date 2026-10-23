import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Wailmer } from '../../../src/ex-sets/set-sandstorm/wailmer';
import { TestUtils } from '../../test-utils';

describe('Wailmer SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Wailmer()],
      [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Rollout (20)
  it('Should use Rollout', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rollout'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Super Hypno Wave (30) - The Defending Pokémon is now Asleep.
  it('Should use Super Hypno Wave', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the Asleep check between turns
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Super Hypno Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });
});
