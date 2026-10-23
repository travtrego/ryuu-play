import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Vaporeon } from '../../../src/base-sets/set-jungle/vaporeon';
import { TestUtils } from '../../test-utils';

const W = CardType.WATER;

describe('Vaporeon JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Vaporeon()],
      [W, W, W],
    );
  });

  // Quick Attack (10+) - Flip a coin. If heads, this attack does 10 damage plus 20 more damage; if tails, this
  // attack does 10 damage.
  it('Should use Quick Attack - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Quick Attack - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Water Gun (30+) - Does 30 damage plus 10 more damage for each W Energy attached to Vaporeon but not used to pay
  // for this attack's Energy cost. Extra W Energy after the 2nd doesn't count.
  [
    { energies: [W, W, W], damage: 30, label: '3 Water Energy' },
    { energies: [W, W, W, W], damage: 40, label: '4 Water Energy' },
    { energies: [W, W, W, W, W], damage: 50, label: '5 Water Energy' },
    { energies: [W, W, W, W, W, W], damage: 50, label: '6 Water Energy (max 2 extra)' },
    { energies: [W, W, CardType.FIRE, W], damage: 40, label: '3 Water + 1 Fire Energy' },
    { energies: [W, W, CardType.FIRE], damage: 30, label: '2 Water + 1 Fire Energy' },
  ].forEach(({ energies, damage, label }) => {
    it(`Should use Water Gun with ${label}`, () => {
      TestUtils.setActive(sim, [new Vaporeon()], energies);
      const { opponent } = TestUtils.getAll(sim);

      sim.dispatch(new AttackAction(1, 'Water Gun'));

      expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
      expect(opponent.active.damage).toEqual(damage);
    });
  });
});
