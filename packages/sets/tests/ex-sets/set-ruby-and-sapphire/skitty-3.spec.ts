import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Skitty3 } from '../../../src/ex-sets/set-ruby-and-sapphire/skitty-3';
import { TestUtils } from '../../test-utils';

describe('Skitty RS 3', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Skitty3()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Tackle (10)
  it('Should use Tackle', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tackle'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Lunge (30) - Flip a coin. If tails, this attack does nothing.
  it('Should use Lunge - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Lunge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Lunge - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Lunge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
