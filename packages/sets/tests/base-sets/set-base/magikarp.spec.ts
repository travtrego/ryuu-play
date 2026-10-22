import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Magikarp } from '../../../src/base-sets/set-base/magikarp';
import { TestUtils } from '../../test-utils';

describe('Magikarp BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Magikarp()],
      [CardType.WATER],
    );
  });

  it('Should use Tackle', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tackle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Flail (10x) - Does 10 damage times the number of damage counters on Magikarp.
  it('Should use Flail for 0 damage when Magikarp has no damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Flail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Flail for 20 damage when Magikarp has 2 damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 20;

    sim.dispatch(new AttackAction(1, 'Flail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(20);
  });
});
