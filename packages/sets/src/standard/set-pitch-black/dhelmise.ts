import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { HideNSneak } from './hide-n-sneak';

export class Dhelmise extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 140;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Vengeful Anchor',
      cost: [CardType.PSYCHIC],
      damage: '30+',
      text: 'If you have 4 or more Pokémon that have the Hide \'n\' Sneak Ability in your discard pile, ' +
        'this attack does 140 more damage.',
    },
  ];

  public set: string = 'PBL';

  public name: string = 'Dhelmise';

  public fullName: string = 'Dhelmise PBL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]
      && HideNSneak.countInDiscard(effect.player) >= 4) {
      effect.damage += 140;
    }
    return state;
  }
}
