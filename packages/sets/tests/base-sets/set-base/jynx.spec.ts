import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Jynx } from '../../../src/base-sets/set-base/jynx';
import { TestUtils } from '../../test-utils';

describe('Jynx BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Jynx()],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS],
    );
  });

  // Doubleslap (10×) - Flip 2 coins. This attack does 10 damage times the number of heads.
  it('Should use Doubleslap - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Doubleslap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Doubleslap - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Doubleslap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Doubleslap - 0 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Doubleslap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Meditate (20+) - Does 20 damage plus 10 more damage for each damage counter on the Defending Pokémon.
  it('Should use Meditate - no damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Meditate'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Meditate - 3 damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Meditate'));

    // 30 existing + (20 + 3 * 10)
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });

});
