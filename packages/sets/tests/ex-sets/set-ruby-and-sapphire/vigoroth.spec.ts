import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Vigoroth } from '../../../src/ex-sets/set-ruby-and-sapphire/vigoroth';
import { TestUtils } from '../../test-utils';

describe('Vigoroth RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Vigoroth()], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Fury Swipes (20x) - Flip 3 coins. This attack does 20 damage times the number of heads.
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

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Rage (20+) - Does 20 damage plus 10 more damage for each damage counter on Vigoroth.
  it('Should use Rage - no damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Rage - 3 damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(opponent.active.damage).toEqual(50);
  });

});
