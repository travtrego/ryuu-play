import { AttackEffect, CardType, Effect, PokemonCard, Stage, State, StoreLike } from '@ptcg/common';

/** Marnie's Impidimp — Destined Rivals 134/182. */
export class MarniesImpidimp extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 70;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    { name: 'Filch', cost: [CardType.COLORLESS], damage: '', text: 'Draw a card.' },
    { name: 'Corkscrew Punch', cost: [CardType.DARK], damage: '10', text: '' },
  ];

  public set: string = 'DRI';

  public name: string = 'Marnie\'s Impidimp';

  public fullName: string = 'Marnie\'s Impidimp DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.player.deck.moveTo(effect.player.hand, 1);
    }
    return state;
  }
}
