import {
  CardType,
  ChooseCardsPrompt,
  EnergyCard,
  EnergyType,
  Player,
  PokemonCard,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';
import { NightStretcher } from '../../../src/standard/set-shrouded-fable/night-stretcher';

class TestPokemon extends PokemonCard {
  public cardTypes: CardType[] = [CardType.PSYCHIC];
  public set: string = 'TEST';
  public name: string = 'Test Pokemon';
  public fullName: string = 'Test Pokemon TEST';
  public hp: number = 60;
}

class TestEnergy extends EnergyCard {
  public set: string = 'TEST';
  public name: string;
  public fullName: string;

  constructor(name: string, energyType: EnergyType) {
    super();
    this.name = name;
    this.fullName = `${name} TEST`;
    this.energyType = energyType;
    this.provides = [CardType.PSYCHIC];
  }
}

class TestItem extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;
  public set: string = 'TEST';
  public name: string = 'Test Item';
  public fullName: string = 'Test Item TEST';
}

describe('Night Stretcher', () => {
  it('recovers one Pokemon or Basic Energy but not Special Energy or Trainers', () => {
    const card = new NightStretcher();
    const state = new State();
    const player = new Player();
    player.id = 1;
    state.players = [player];

    const pokemon = new TestPokemon();
    const basicEnergy = new TestEnergy('Basic Energy', EnergyType.BASIC);
    const specialEnergy = new TestEnergy('Special Energy', EnergyType.SPECIAL);
    const item = new TestItem();
    player.discard.cards = [pokemon, basicEnergy, specialEnergy, item];

    let prompt: any;
    let callback: ((result: any) => void) | undefined;
    const store = {
      prompt: (currentState: State, nextPrompt: any, then: (result: any) => void) => {
        prompt = nextPrompt;
        callback = then;
        return currentState;
      },
    } as unknown as StoreLike;

    card.reduceEffect(store, state, new TrainerEffect(player, card));

    expect(prompt instanceof ChooseCardsPrompt).toBe(true);
    expect(prompt.options.max).toBe(1);
    expect(prompt.cards.cards).toEqual([pokemon, basicEnergy, specialEnergy, item]);

    callback!([basicEnergy]);
    expect(player.hand.cards).toEqual([basicEnergy]);
    expect(player.discard.cards).toEqual([pokemon, specialEnergy, item]);
  });
});
