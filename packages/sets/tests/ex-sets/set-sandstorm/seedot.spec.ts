import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Seedot } from '../../../src/ex-sets/set-sandstorm/seedot';
import { TestUtils } from '../../test-utils';

describe('Seedot SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Seedot()], [CardType.GRASS]);
  });

  // Surprise Attack (30) - Flip a coin. If tails, this attack does nothing.
  it('Should use Surprise Attack - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Surprise Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Surprise Attack - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Surprise Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});
