import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Electabuzz } from '../../../src/base-sets/set-base/electabuzz';
import { TestUtils } from '../../test-utils';

describe('Electabuzz BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Electabuzz()],
      [CardType.LIGHTNING, CardType.COLORLESS],
    );
  });

  // Thundershock (10) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Thundershock - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thundershock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Thundershock - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thundershock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Thunderpunch (30+) - Flip a coin. If heads, this attack does 30 damage plus 10 more damage; if tails, this
  // attack does 30 damage plus Electabuzz does 10 damage to itself.
  it('Should use Thunderpunch - heads', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunderpunch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Thunderpunch - tails', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunderpunch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(10);
  });

});
