import {
  AttackAction,
  CardType,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { Electrode } from '../../../src/base-sets/set-jungle/electrode';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

function typedPokemon(cardType: CardType, weakness: CardType[] = []): PokemonCard {
  const pokemon = new TestPokemon();
  pokemon.cardTypes = [cardType];
  pokemon.weakness = weakness.map(type => ({ type }));
  return pokemon;
}

describe('Electrode JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Electrode()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING],
    );
  });

  // Tackle (20)
  it('Should use Tackle', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tackle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Chain Lightning (20) - If the Defending Pokémon isn't Colorless, this attack does 10 damage to each Benched
  // Pokémon of the same type as the Defending Pokémon (including your own).
  it('Should use Chain Lightning - damages each Benched Pokémon of the Defending Pokémon\'s type', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [typedPokemon(CardType.GRASS)]);
    player.bench[0] = TestUtils.pokemonSlot([typedPokemon(CardType.GRASS)]);
    player.bench[1] = TestUtils.pokemonSlot([typedPokemon(CardType.FIRE)]);
    // Weakness is not applied to Benched Pokémon
    opponent.bench[0] = TestUtils.pokemonSlot([typedPokemon(CardType.GRASS, [CardType.LIGHTNING])]);
    opponent.bench[1] = TestUtils.pokemonSlot([typedPokemon(CardType.WATER)]);
    opponent.bench[2] = TestUtils.pokemonSlot([typedPokemon(CardType.COLORLESS)]);

    sim.dispatch(new AttackAction(1, 'Chain Lightning'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(10);
    expect(player.bench[1].damage).toEqual(0);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[1].damage).toEqual(0);
    expect(opponent.bench[2].damage).toEqual(0);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Chain Lightning - no Bench damage when the Defending Pokémon is Colorless', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [typedPokemon(CardType.COLORLESS)]);
    player.bench[0] = TestUtils.pokemonSlot([typedPokemon(CardType.COLORLESS)]);
    opponent.bench[0] = TestUtils.pokemonSlot([typedPokemon(CardType.COLORLESS)]);

    sim.dispatch(new AttackAction(1, 'Chain Lightning'));

    expect(opponent.active.damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(0);
    expect(opponent.bench[0].damage).toEqual(0);
  });
});
