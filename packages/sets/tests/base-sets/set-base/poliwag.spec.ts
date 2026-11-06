import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Poliwag } from '../../../src/base-sets/set-base/poliwag';
import { TestUtils } from '../../test-utils';

describe('Poliwag BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  // Water Gun (10+) - Does 10 damage plus 10 more damage for each W Energy attached to Poliwag but not used to
  // pay for this attack's Energy cost. Extra W Energy after the 2nd don't count.
  it('Should use Water Gun for 10 damage with no extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwag()], [CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Water Gun for 20 damage with 1 extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwag()], [CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Water Gun for 30 damage with 2 extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwag()], [CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Water Gun and ignore extra Water Energy after the 2nd', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwag()], [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Water Gun and not count non-Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Poliwag()], [CardType.WATER, CardType.FIRE, CardType.COLORLESS]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(10);
  });
});
