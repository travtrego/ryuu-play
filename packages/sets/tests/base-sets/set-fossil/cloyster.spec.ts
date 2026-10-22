import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Cloyster } from '../../../src/base-sets/set-fossil/cloyster';
import { TestUtils } from '../../test-utils';

describe('Cloyster FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Cloyster()],
      [CardType.WATER, CardType.WATER]
    );
  });

  // Clamp (30) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed. If tails, this attack does nothing
  // (not even damage).
  it('Should use Clamp - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Clamp'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Clamp - tails does nothing', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Clamp'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Spike Cannon (30×) - Flip 2 coins. This attack does 30 damage times the number of heads.
  it('Should use Spike Cannon - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Spike Cannon'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Spike Cannon - heads, tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Spike Cannon'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Spike Cannon - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Spike Cannon'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});
