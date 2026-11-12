import {
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { HideNSneak } from './hide-n-sneak';

export class Shuppet extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 50;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [HideNSneak.power()];

  public attacks = [
    {
      name: 'Hang Down',
      cost: [CardType.PSYCHIC],
      damage: '10',
      text: '',
    },
  ];

  public set: string = 'PBL';

  public name: string = 'Shuppet';

  public fullName: string = 'Shuppet PBL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    HideNSneak.reduce(this, store, state, effect);
    return state;
  }
}
