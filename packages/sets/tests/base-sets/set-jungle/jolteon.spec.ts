import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Jolteon } from '../../../src/base-sets/set-jungle/jolteon';
import { TestUtils } from '../../test-utils';

describe('Jolteon JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Jolteon()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS],
    );
  });

  // Quick Attack (10+) - Flip a coin. If heads, this attack does 10 damage plus 20 more damage; if tails, this
  // attack does 10 damage.
  it('Should use Quick Attack - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Quick Attack - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Pin Missile (20x) - Flip 4 coins. This attack does 20 damage times the number of heads.
  it('Should use Pin Missile - 4 heads', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pin Missile'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });

  it('Should use Pin Missile - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false, true, true]);

    sim.dispatch(new AttackAction(1, 'Pin Missile'));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Pin Missile - 4 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Pin Missile'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});
