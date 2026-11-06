import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { AggronEx } from '../../../src/ex-sets/set-sandstorm/aggron-ex';
import { Arbok } from '../../../src/ex-sets/set-sandstorm/arbok';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Arbok SS', () => {
  let sim: Simulator;
  let attacker: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Arbok()],
      [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS]
    );

    attacker = new TestPokemon();
    attacker.attacks = [{ name: 'Test attack', cost: [], damage: '30', text: '' }];
    TestUtils.setDefending(sim, [attacker]);
  });

  // Intimidating Fang - As long as Arbok is your Active Pokémon, any damage done to your Pokémon by an opponent's
  // attack is reduced by 10 (before applying Weakness and Resistance).
  it('Should reduce damage done to Arbok by 10', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should reduce damage by 10 before applying Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.PSYCHIC];
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    // (30 - 10) x 2
    expect(player.active.damage).toEqual(40);
  });

  it('Should reduce damage done to Benched Pokémon by 10', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setDefending(sim, [new AggronEx()],
      [CardType.METAL, CardType.METAL, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    TestUtils.setActivePlayer(sim, opponent);

    // Metal Surge (50) - Does 20 damage to each of your opponent's Benched Pokémon.
    sim.dispatch(new AttackAction(2, 'Metal Surge'));

    expect(player.active.damage).toEqual(40);
    expect(player.bench[0].damage).toEqual(10);
  });

  it('Should not reduce damage when Intimidating Fang is blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(30);
  });

  it('Should not reduce damage when Arbok is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new Arbok()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(30);
  });

  // Toxic (20) - The Defending Pokémon is now Poisoned. Put 2 damage counters instead of 1 on the Defending Pokémon
  // between turns.
  it('Should use Toxic', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Toxic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 20 damage + 20 poison damage between turns
    expect(opponent.active.damage).toEqual(40);
  });
});
