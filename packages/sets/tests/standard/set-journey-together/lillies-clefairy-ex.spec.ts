import {
  AttackEffect,
  CardType,
  CheckPokemonStatsEffect,
  Player,
  PokemonCard,
  PokemonSlot,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { LilliesClefairyEx } from '../../../src/standard/set-journey-together/lillies-clefairy-ex';

class TestDragon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardTypes: CardType[] = [CardType.DRAGON];
  public hp: number = 100;
  public weakness = [{ type: CardType.METAL }];
  public set: string = 'TEST';
  public name: string;
  public fullName: string;

  constructor(name: string) {
    super();
    this.name = name;
    this.fullName = `${name} TEST`;
  }
}

class TestPokemon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardTypes: CardType[] = [CardType.COLORLESS];
  public hp: number = 60;
  public set: string = 'TEST';
  public name: string;
  public fullName: string;

  constructor(name: string) {
    super();
    this.name = name;
    this.fullName = `${name} TEST`;
  }
}

const store = {} as StoreLike;

describe("Lillie's Clefairy ex", () => {
  it('changes an opposing Dragon Pokemon weakness to Psychic while Clefairy is in play', () => {
    const clefairy = new LilliesClefairyEx();
    const state = new State();
    const player = new Player();
    const opponent = new Player();
    player.id = 1;
    opponent.id = 2;
    state.players = [player, opponent];
    state.activePlayer = 0;
    player.bench = [new PokemonSlot()];

    player.bench[0].pokemons.cards = [clefairy];
    opponent.active.pokemons.cards = [new TestDragon('Opponent Dragon')];

    const effect = new CheckPokemonStatsEffect(opponent.active);
    clefairy.reduceEffect(store, state, effect);

    expect(effect.weakness).toEqual([{ type: CardType.PSYCHIC }]);
  });

  it('does not apply Fairy Zone while Clefairy is not in play', () => {
    const clefairy = new LilliesClefairyEx();
    const state = new State();
    const player = new Player();
    const opponent = new Player();
    player.id = 1;
    opponent.id = 2;
    state.players = [player, opponent];
    state.activePlayer = 0;

    player.hand.cards = [clefairy];
    opponent.active.pokemons.cards = [new TestDragon('Opponent Dragon')];

    const effect = new CheckPokemonStatsEffect(opponent.active);
    clefairy.reduceEffect(store, state, effect);

    expect(effect.weakness).toEqual([{ type: CardType.METAL }]);
  });

  it('adds 20 damage for every occupied Bench slot on both sides', () => {
    const clefairy = new LilliesClefairyEx();
    const state = new State();
    const player = new Player();
    const opponent = new Player();
    player.id = 1;
    opponent.id = 2;
    state.players = [player, opponent];
    state.activePlayer = 0;
    player.bench = [new PokemonSlot()];
    opponent.bench = [new PokemonSlot(), new PokemonSlot()];

    player.active.pokemons.cards = [clefairy];
    player.bench[0].pokemons.cards = [new TestPokemon('Player Bench')];
    opponent.bench[0].pokemons.cards = [new TestPokemon('Opponent Bench A')];
    opponent.bench[1].pokemons.cards = [new TestPokemon('Opponent Bench B')];

    const effect = new AttackEffect(player, opponent, clefairy.attacks[0]);
    clefairy.reduceEffect(store, state, effect);

    expect(effect.damage).toBe(80);
  });
});
