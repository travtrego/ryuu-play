import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Lapras } from '../../../src/base-sets/set-fossil/lapras';
import { TestUtils } from '../../test-utils';

describe('Lapras FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  // Water Gun (10+) - Does 10 damage plus 10 more damage for each W Energy attached to Lapras but not used to pay
  // for this attack's Energy cost. You can't add more than 20 damage in this way.
  it('Should use Water Gun - no extra Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Lapras()], [CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Water Gun - 1 extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Lapras()], [CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Water Gun - capped at 20 extra damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Lapras()], [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Water Gun - non-Water Energy does not count', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Lapras()], [CardType.WATER, CardType.FIRE, CardType.GRASS]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Confuse Ray (10) - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Confuse Ray - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Lapras()], [CardType.WATER, CardType.WATER]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Confuse Ray - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Lapras()], [CardType.WATER, CardType.WATER]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});
