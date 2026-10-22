import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Doduo } from '../../../src/base-sets/set-base/doduo';
import { TestUtils } from '../../test-utils';

describe('Doduo BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Doduo()],
      [CardType.COLORLESS],
    );
  });

  // Fury Attack (10×) - Flip 2 coins. This attack does 10 damage times the number of heads.
  it('Should use Fury Attack - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Fury Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Fury Attack - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Fury Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Fury Attack - 0 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Fury Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
