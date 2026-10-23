import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { ElectabuzzEx } from '../../../src/ex-sets/set-ruby-and-sapphire/electabuzz-ex';
import { TestUtils } from '../../test-utils';

describe('Electabuzz ex RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new ElectabuzzEx()], [CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS]);
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

    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Quick Attack (40+) - Flip a coin. If heads, this attack does 40 damage plus 20 more damage.
  it('Should use Quick Attack - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Quick Attack - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(opponent.active.damage).toEqual(40);
  });

});
