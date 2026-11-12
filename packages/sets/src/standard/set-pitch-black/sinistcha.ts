import {
  AttackEffect,
  CardType,
  Effect,
  PlayerType,
  PokemonCard,
  PutCountersEffect,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { HideNSneak } from './hide-n-sneak';

export class Sinistcha extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Poltchageist';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 60;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public powers = [HideNSneak.power()];

  public attacks = [
    {
      name: 'Matcha Spin',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'If you have 6 or more Pokémon that have the Hide \'n\' Sneak Ability in your discard pile, ' +
        'place 4 damage counters on each of your opponent\'s Pokémon.',
    },
  ];

  public set: string = 'PBL';

  public name: string = 'Sinistcha';

  public fullName: string = 'Sinistcha PBL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (HideNSneak.reduce(this, store, state, effect)) {
      return state;
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      if (HideNSneak.countInDiscard(effect.player) < 6) {
        return state;
      }
      effect.opponent.forEachPokemon(PlayerType.TOP_PLAYER, slot => {
        const counters = new PutCountersEffect(effect, 40);
        counters.target = slot;
        store.reduceEffect(state, counters);
      });
    }

    return state;
  }
}
