import {
  AttackEffect,
  CardTag,
  CardType,
  Effect,
  PokemonCard,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';
import { commonAttacks } from '../../common';

/** Mega Golisopod ex — Delta Reign 11. */
export class MegaGolisopodEx extends PokemonCard {
  public tags = [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Wimpod';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 340;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Finishing Blow',
      cost: [CardType.GRASS],
      damage: '60+',
      text: 'If your opponent\'s Active Pokémon already has any damage counters on it, this attack does 160 ' +
        'more damage.',
    },
    {
      name: 'Quadruple Hold',
      cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '160',
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
    },
  ];

  public set: string = 'DLR';

  public name: string = 'Mega Golisopod ex';

  public fullName: string = 'Mega Golisopod ex DLR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    const cantRetreat = commonAttacks.cantRetreat(this, store, state, effect);

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      if (opponent.active.damage > 0) {
        effect.damage += 160;
      }
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      return cantRetreat.use(effect);
    }

    return state;
  }
}
