import { CardType, PokemonCard, Stage } from '@ptcg/common';

export class Dreepy extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DRAGON];

  public hp: number = 70;

  public weakness = [];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Petty Grudge', cost: [CardType.PSYCHIC], damage: '10', text: '' },
    { name: 'Bite', cost: [CardType.FIRE, CardType.PSYCHIC], damage: '40', text: '' },
  ];

  public set: string = 'TWM';

  public name: string = 'Dreepy';

  public fullName: string = 'Dreepy TWM';
}
