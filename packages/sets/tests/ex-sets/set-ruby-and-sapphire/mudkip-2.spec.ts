import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Mudkip2 } from '../../../src/ex-sets/set-ruby-and-sapphire/mudkip-2';
import { TestUtils } from '../../test-utils';

describe('Mudkip RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Mudkip2()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Pound (10)
  it('Should use Pound', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pound'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Fury Swipes (10x) - Flip 3 coins. This attack does 10 damage times the number of heads.
  it('Should use Fury Swipes - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Fury Swipes - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Fury Swipes - 3 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
