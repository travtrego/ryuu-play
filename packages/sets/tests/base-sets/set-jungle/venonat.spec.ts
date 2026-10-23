import {
  AttackAction,
  CardType,
  PokemonCard,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Venonat } from '../../../src/base-sets/set-jungle/venonat';
import { TestUtils } from '../../test-utils';

describe('Venonat JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Venonat()],
      [CardType.GRASS, CardType.COLORLESS],
    );
  });

  // Stun Spore (10) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Stun Spore - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stun Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Stun Spore - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stun Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Leech Life (10) - Remove a number of damage counters from Venonat equal to the damage done to the Defending
  // Pokémon (after applying Weakness and Resistance).
  it('Should use Leech Life and remove 1 damage counter', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Leech Life and remove damage counters after applying Weakness', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.GRASS }];

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Leech Life and not heal when Resistance prevents the damage', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    (opponent.active.getPokemonCard() as PokemonCard).resistance = [{ type: CardType.GRASS, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(opponent.active.damage).toEqual(0);
    expect(player.active.damage).toEqual(30);
  });
});
