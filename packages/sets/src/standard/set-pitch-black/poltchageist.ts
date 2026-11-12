import {
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  PutCountersEffect,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { HideNSneak } from './hide-n-sneak';

export class Poltchageist extends PokemonCard {
  public stage: Stage = Stage.BASIC;

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 30;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [];

  public powers = [HideNSneak.power()];

  public attacks = [
    {
      name: 'Furtive Drop',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'Place 1 damage counter on your opponent\'s Active Pokémon.',
    },
  ];

  public set: string = 'PBL';

  public name: string = 'Poltchageist';

  public fullName: string = 'Poltchageist PBL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (HideNSneak.reduce(this, store, state, effect)) {
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const counters = new PutCountersEffect(effect, 10);
      counters.target = effect.opponent.active;
      store.reduceEffect(state, counters);
    }

    return state;
  }
}
