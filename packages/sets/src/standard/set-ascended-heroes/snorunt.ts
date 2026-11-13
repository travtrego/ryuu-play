import { CardType, PokemonCard, Stage } from '@ptcg/common';

export class SnoruntASC extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 70;

  public weakness = [{ type: CardType.METAL }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Chilly',
      cost: [CardType.WATER],
      damage: '10',
      text: '',
    },
  ];

  public set: string = 'ASC';

  public name: string = 'Snorunt';

  public fullName: string = 'Snorunt ASC';
}
