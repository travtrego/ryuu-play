import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Dewgong } from '../../../src/base-sets/set-base/dewgong';
import { TestUtils } from '../../test-utils';

describe('Dewgong BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Dewgong()],
      [CardType.WATER, CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Aurora Beam (50)
  it('Should use Aurora Beam', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Aurora Beam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Ice Beam (30) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Ice Beam - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Ice Beam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Ice Beam - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Ice Beam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
  });

});
