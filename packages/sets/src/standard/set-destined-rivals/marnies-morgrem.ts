import { CardType, PokemonCard, Stage } from '@ptcg/common';

/** Marnie's Morgrem — Destined Rivals 135/182. */
export class MarniesMorgrem extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Marnie\'s Impidimp';

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 100;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Corkscrew Punch', cost: [CardType.DARK, CardType.DARK], damage: '60', text: '' },
  ];

  public set: string = 'DRI';

  public name: string = 'Marnie\'s Morgrem';

  public fullName: string = 'Marnie\'s Morgrem DRI';
}
