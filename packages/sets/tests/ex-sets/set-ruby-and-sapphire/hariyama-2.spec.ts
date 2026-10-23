import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Hariyama2 } from '../../../src/ex-sets/set-ruby-and-sapphire/hariyama-2';
import { TestUtils } from '../../test-utils';

describe('Hariyama RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Hariyama2()], [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Shove (20) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Shove - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Shove'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Shove - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Shove'));

    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Slap Down (40+) - Flip 2 coins. This attack does 40 damage plus 10 more damage for each heads.
  it('Should use Slap Down - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Slap Down'));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Slap Down - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Slap Down'));

    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Slap Down - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Slap Down'));

    expect(opponent.active.damage).toEqual(40);
  });

});
