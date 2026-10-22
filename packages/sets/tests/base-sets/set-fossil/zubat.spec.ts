import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Zubat } from '../../../src/base-sets/set-fossil/zubat';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Zubat FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Zubat()],
      [CardType.GRASS, CardType.COLORLESS]
    );
  });

  // Supersonic - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Supersonic - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Supersonic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Supersonic - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Supersonic'));

    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Leech Life (10) - Remove a number of damage counters from Zubat equal to the damage done to the Defending
  // Pokémon (after applying Weakness and Resistance). If Zubat has fewer damage counters than that, remove all.
  it('Should use Leech Life', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Leech Life - after Weakness', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.GRASS }];
    TestUtils.setDefending(sim, [weak]);

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Leech Life - no damage counters on Zubat', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(opponent.active.damage).toEqual(10);
    expect(player.active.damage).toEqual(0);
  });
});
