import { CardType, PokemonCard, Stage } from '@ptcg/common';

export class Beldum extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.METAL];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.GRASS, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Headbutt', cost: [CardType.METAL], damage: '10', text: '' },
    { name: 'Beam', cost: [CardType.METAL, CardType.COLORLESS], damage: '20', text: '' },
  ];

  public set: string = 'CRI';

  public name: string = 'Beldum';

  public fullName: string = 'Beldum CRI';
}
