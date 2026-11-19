import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

import { commonAttacks } from '../../common';

export class YveltalMEG extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.DARK];

  public hp: number = 110;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [];

  public attacks = [
    {
      name: 'Clutch',
      cost: [CardType.DARK],
      damage: '20',
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
    },
    { name: 'Dark Feather', cost: [CardType.DARK, CardType.DARK, CardType.COLORLESS], damage: '110', text: '' },
  ];

  public set: string = 'MEG';

  public name: string = 'Yveltal';

  public fullName: string = 'Yveltal MEG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const cantRetreat = commonAttacks.cantRetreat(this, store, state, effect);

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      return cantRetreat.use(effect);
    }

    return state;
  }
}
