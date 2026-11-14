import { CardType, PokemonCard, Stage } from '@ptcg/common';

export class StaryuPOR extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.WATER];

  public hp: number = 70;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Water Gun', cost: [CardType.WATER], damage: '20', text: '' },
  ];

  public set: string = 'POR';

  public name: string = 'Staryu';

  public fullName: string = 'Staryu POR';
}
