import { AttackAction, CardType, Simulator } from '@ptcg/common';

import { Prinplup } from '../../../src/standard/set-black-and-white/prinplup';
import { TestUtils } from '../../test-utils';

describe('Prinplup DEX', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Prinplup()],
      [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Razor Wing (20)
  it('Should use Razor Wing for 20 damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Razor Wing'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Fury Attack (30x) - Flip 3 coins. This attack does 30 damage times the number of heads.
  it('Should use Fury Attack - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true]);

    sim.dispatch(new AttackAction(1, 'Fury Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(90);
  });

  it('Should use Fury Attack - 1 head', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true, false]);

    sim.dispatch(new AttackAction(1, 'Fury Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Fury Attack - no heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, false]);

    sim.dispatch(new AttackAction(1, 'Fury Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});
