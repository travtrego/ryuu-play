import { CardType, PokemonCard, Stage } from '@ptcg/common';

export class NsZorua extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 70;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Scratch',
      cost: [CardType.DARK],
      damage: '20',
      text: '',
    },
  ];

  public set: string = 'JTG';

  public name: string = 'N\'s Zorua';

  public fullName: string = 'N\'s Zorua JTG';
}
