import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Beautifly } from '../../../src/ex-sets/set-ruby-and-sapphire/beautifly';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Beautifly RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Beautifly()], [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Withering Dust - As long as Beautifly is in play, do not apply Resistance for all Active Pokémon.
  it('Should use Withering Dust - Resistance not applied for own attacks', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const attacker = new TestPokemon();
    attacker.cardTypes = [CardType.GRASS];
    player.bench[0] = player.active;
    player.active = TestUtils.pokemonSlot([attacker]);
    const defending = opponent.active.getPokemonCard() as PokemonCard;
    defending.resistance = [{ type: CardType.GRASS, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Withering Dust - Resistance not applied for opponent\'s attacks', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const attacker = opponent.active.getPokemonCard() as PokemonCard;
    attacker.cardTypes = [CardType.FIGHTING];
    attacker.attacks = [{ name: 'Big attack', cost: [], damage: '40', text: '' }];
    (player.active.getPokemonCard() as PokemonCard).resistance = [{ type: CardType.FIGHTING, value: -30 }];

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(40);
  });

  it('Should use Withering Dust - power blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const attacker = new TestPokemon();
    attacker.cardTypes = [CardType.GRASS];
    attacker.attacks = [{ name: 'Big attack', cost: [], damage: '40', text: '' }];
    player.bench[0] = player.active;
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    player.active = TestUtils.pokemonSlot([attacker]);
    const defending = opponent.active.getPokemonCard() as PokemonCard;
    defending.resistance = [{ type: CardType.GRASS, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Big attack'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Stun Spore (20) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Stun Spore - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stun Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Stun Spore - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stun Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Parallel Gain (50) - Remove 1 damage counter from each of your Pokémon, including Beautifly.
  it('Should use Parallel Gain', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 20);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Parallel Gain'));

    expect(opponent.active.damage).toEqual(50);
    expect(player.active.damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(10);
    expect(player.bench[1].damage).toEqual(0);
  });

  it('Should use Parallel Gain - damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Parallel Gain'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

});
