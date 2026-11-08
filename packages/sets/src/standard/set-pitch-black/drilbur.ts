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

export class Drilbur extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.FIGHTING];

  public hp: number = 70;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Call for Family',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'Search your deck for up to 2 Basic Pokémon and put them onto your Bench. Then, shuffle your deck.',
    },
    { name: 'Dig Claws', cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS], damage: '50', text: '' },
  ];

  public set: string = 'PBL';

  public name: string = 'Drilbur';

  public fullName: string = 'Drilbur PBL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const callForFamily = commonAttacks.callForFamily(this, store, state, effect);

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      return callForFamily.use(effect, {}, 2);
    }

    return state;
  }
}
