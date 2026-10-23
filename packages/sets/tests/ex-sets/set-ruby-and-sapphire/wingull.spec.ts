import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Wingull } from '../../../src/ex-sets/set-ruby-and-sapphire/wingull';
import { TestUtils } from '../../test-utils';

describe('Wingull RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Wingull()], [CardType.WATER]);
  });

  // Surprise Attack (20) - Flip a coin. If tails, this attack does nothing.
  it('Should use Surprise Attack - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Surprise Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Surprise Attack - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Surprise Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});
