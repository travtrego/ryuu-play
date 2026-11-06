import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Zigzagoon } from '../../../src/ex-sets/set-ruby-and-sapphire/zigzagoon';
import { TestUtils } from '../../test-utils';

describe('Zigzagoon RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Zigzagoon()], [CardType.COLORLESS]);
  });

  // Fury Swipes (10x) - Flip 3 coins. This attack does 10 damage times the number of heads.
  it('Should use Fury Swipes - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Fury Swipes - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Fury Swipes - 3 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
