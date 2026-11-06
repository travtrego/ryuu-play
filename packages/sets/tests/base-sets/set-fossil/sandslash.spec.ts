import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Sandslash } from '../../../src/base-sets/set-fossil/sandslash';
import { TestUtils } from '../../test-utils';

describe('Sandslash FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Sandslash()],
      [CardType.FIGHTING, CardType.FIGHTING]
    );
  });

  // Slash (20)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Fury Swipes (20×) - Flip 3 coins. This attack does 20 damage times the number of heads.
  it('Should use Fury Swipes - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Fury Swipes - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true, false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Fury Swipes - 3 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(opponent.active.damage).toEqual(0);
  });
});
