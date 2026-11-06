import {
  CardType,
  ChooseCardsPrompt,
  EnergyCard,
  EnergyType,
  Player,
  PokemonCard,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  State,
  StoreLike,
  TrainerEffect,
} from '@ptcg/common';
import { BugCatchingSet } from '../../../src/standard/set-twilight-masquerade/bug-catching-set';

class TestPokemon extends PokemonCard {
  public set: string = 'TEST';
  public name: string;
  public fullName: string;
  public hp: number = 60;

  constructor(name: string, type: CardType) {
    super();
    this.name = name;
    this.fullName = `${name} TEST`;
    this.cardTypes = [type];
  }
}

class TestEnergy extends EnergyCard {
  public set: string = 'TEST';
  public name: string;
  public fullName: string;
  public energyType: EnergyType = EnergyType.BASIC;

  constructor(name: string, type: CardType) {
    super();
    this.name = name;
    this.fullName = `${name} TEST`;
    this.provides = [type];
  }
}

describe('Bug Catching Set', () => {
  it('only offers Grass Pokemon and Basic Grass Energy from the top 7', () => {
    const card = new BugCatchingSet();
    const state = new State();
    const player = new Player();
    const opponent = new Player();
    player.id = 1;
    opponent.id = 2;
    state.players = [player, opponent];
    state.activePlayer = 0;

    const grassPokemon = new TestPokemon('Grass Pokemon', CardType.GRASS);
    const grassEnergy = new TestEnergy('Grass Energy', CardType.GRASS);
    const firePokemon = new TestPokemon('Fire Pokemon', CardType.FIRE);
    const fireEnergy = new TestEnergy('Fire Energy', CardType.FIRE);
    const fillers = [
      new TestPokemon('Filler A', CardType.PSYCHIC),
      new TestPokemon('Filler B', CardType.PSYCHIC),
      new TestPokemon('Filler C', CardType.PSYCHIC),
    ];
    const eighth = new TestPokemon('Eighth Card', CardType.GRASS);
    player.deck.cards = [grassPokemon, grassEnergy, firePokemon, fireEnergy, ...fillers, eighth];

    const prompts: any[] = [];
    const callbacks: Array<(result: any) => void> = [];
    const store = {
      prompt: (currentState: State, prompt: any, then: (result: any) => void) => {
        prompts.push(prompt);
        callbacks.push(then);
        return currentState;
      },
    } as unknown as StoreLike;

    card.reduceEffect(store, state, new TrainerEffect(player, card));

    expect(prompts[0] instanceof ChooseCardsPrompt).toBe(true);
    expect(prompts[0].cards.cards).toEqual([grassPokemon, grassEnergy]);
    expect(prompts[0].options.max).toBe(2);

    callbacks[0]([grassPokemon, grassEnergy]);
    expect(prompts[1] instanceof ShowCardsPrompt).toBe(true);

    callbacks[1](undefined);
    expect(prompts[2] instanceof ShuffleDeckPrompt).toBe(true);
    expect(player.hand.cards).toEqual([grassPokemon, grassEnergy]);
    expect(player.deck.cards.length).toBe(6);
    expect(player.deck.cards).toContain(eighth);
    expect(player.deck.cards).toContain(firePokemon);
    expect(player.deck.cards).toContain(fireEnergy);
  });
});
