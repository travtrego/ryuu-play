import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Kingler } from '../../../src/base-sets/set-fossil/kingler';
import { TestUtils } from '../../test-utils';

describe('Kingler FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Kingler()],
      [CardType.WATER, CardType.WATER, CardType.COLORLESS]
    );
  });

  // Flail (10×) - Does 10 damage times the number of damage counters on Kingler.
  it('Should use Flail', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Flail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Flail - no damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Flail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Crabhammer (40)
  it('Should use Crabhammer', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Crabhammer'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });
});
