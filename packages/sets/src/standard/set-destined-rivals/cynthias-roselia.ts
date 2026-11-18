import {
  CardType,
  PokemonCard,
  Stage,
} from '@ptcg/common';

export class CynthiasRoselia extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Spike Sting', cost: [CardType.COLORLESS], damage: '20', text: '' },
  ];

  public set: string = 'DRI';

  public name: string = 'Cynthia\'s Roselia';

  public fullName: string = 'Cynthia\'s Roselia DRI';
}
