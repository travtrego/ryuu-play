import { CardType, PokemonCard, Stage } from '@ptcg/common';

export class Grookey extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Smash Kick', cost: [CardType.GRASS], damage: '10', text: '' },
    { name: 'Branch Poke', cost: [CardType.GRASS, CardType.GRASS], damage: '30', text: '' },
  ];

  public set: string = 'TWM';

  public name: string = 'Grookey';

  public fullName: string = 'Grookey TWM';
}
