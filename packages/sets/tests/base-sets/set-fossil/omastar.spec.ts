import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Omastar } from '../../../src/base-sets/set-fossil/omastar';
import { TestUtils } from '../../test-utils';

describe('Omastar FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Omastar()],
      [CardType.WATER, CardType.WATER]
    );
  });

  // Water Gun (20+) - Does 20 damage plus 10 more damage for each W Energy attached to Omastar but not used to pay
  // for this attack's Energy cost. You can't add more than 20 damage in this way.
  it('Should use Water Gun - no extra Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Water Gun - 1 extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Omastar()], [CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Water Gun - capped at 20 extra damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Omastar()],
      [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Water Gun - non-Water Energy pays the Colorless cost', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Omastar()], [CardType.FIRE, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(30);
  });

  // Spike Cannon (30×) - Flip 2 coins. This attack does 30 damage times the number of heads.
  it('Should use Spike Cannon - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Spike Cannon'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Spike Cannon - heads, tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Spike Cannon'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Spike Cannon - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Spike Cannon'));

    expect(opponent.active.damage).toEqual(0);
  });
});
