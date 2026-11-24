import { CardType, PokemonCard, Stage } from '@ptcg/common';

export class MakuhitaMEG extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 80;

  public weakness = [{ type: CardType.PSYCHIC }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Corkscrew Punch',
      cost: [CardType.FIGHTING],
      damage: '10',
      text: '',
    },
    {
      name: 'Confront',
      cost: [CardType.FIGHTING, CardType.FIGHTING],
      damage: '30',
      text: '',
    },
  ];

  public set: string = 'MEG';

  public name: string = 'Makuhita';

  public fullName: string = 'Makuhita MEG';
}
