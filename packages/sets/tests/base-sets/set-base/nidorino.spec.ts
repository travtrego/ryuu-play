import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Nidorino } from '../../../src/base-sets/set-base/nidorino';
import { TestUtils } from '../../test-utils';

describe('Nidorino BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Nidorino()],
      [CardType.GRASS, CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Double Kick (30x) - Flip 2 coins. This attack does 30 damage times the number of heads.
  it('Should use Double Kick for 60 damage on 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Kick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Double Kick for 30 damage on 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Double Kick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Double Kick for 0 damage on 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Kick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Horn Drill', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Horn Drill'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });
});
