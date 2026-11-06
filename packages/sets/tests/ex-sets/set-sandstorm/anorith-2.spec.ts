import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Anorith2 } from '../../../src/ex-sets/set-sandstorm/anorith-2';
import { TestUtils } from '../../test-utils';

describe('Anorith SS-2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Anorith2()],
      [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Slash (20)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Double Scratch (40x) - Flip 2 coins. This attack does 40 damage times the number of heads.
  it('Should use Double Scratch - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });

  it('Should use Double Scratch - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Double Scratch - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});
