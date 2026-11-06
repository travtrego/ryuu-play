import {
  CardType,
  Effect,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { useCursedBlast } from './cursed-blast';

export class Dusclops extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Duskull';

  public cardTypes: CardType[] = [CardType.PSYCHIC];

  public hp: number = 90;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Cursed Blast',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: 'Once during your turn, you may put 5 damage counters on 1 of your opponent\'s Pokémon. ' +
        'If you use this Ability, this Pokémon is Knocked Out.',
    },
  ];

  public attacks = [
    { name: 'Will-O-Wisp', cost: [CardType.PSYCHIC, CardType.PSYCHIC], damage: '50', text: '' },
  ];

  public set: string = 'PRE';

  public name: string = 'Dusclops';

  public fullName: string = 'Dusclops PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // No once-per-turn marker is needed: using the Ability Knocks this Pokémon Out.
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      return useCursedBlast(store, state, effect, this, 5);
    }
    return state;
  }
}
