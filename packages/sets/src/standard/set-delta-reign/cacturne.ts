import {
  AttackEffect,
  CardType,
  Effect,
  PlayerType,
  PokemonCard,
  PowerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';
import { commonAttacks } from '../../common';

/** Cacturne — Delta Reign 5. */
export class CacturneDLR extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom: string = 'Cacnea';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 130;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Linear Attack',
      cost: [CardType.COLORLESS],
      damage: '',
      text: 'This attack does 30 damage to 1 of your opponent\'s Pokémon. (Don\'t apply Weakness and ' +
        'Resistance for Benched Pokémon.)',
    },
    {
      name: 'Punishing Needles',
      cost: [CardType.GRASS],
      damage: '10+',
      text: 'This attack does 50 more damage for each of your opponent\'s Pokémon in play that has an Ability.',
    },
  ];

  public set: string = 'DLR';

  public name: string = 'Cacturne';

  public fullName: string = 'Cacturne DLR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const damageOpponentPokemon = commonAttacks.damageOpponentPokemon(this, store, state, effect);
      return damageOpponentPokemon.use(effect, 30);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      let withAbility = 0;
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, (slot, card) => {
        if (card.powers.some(p => p.powerType === PowerType.ABILITY)) {
          withAbility += 1;
        }
      });
      effect.damage += 50 * withAbility;
    }

    return state;
  }
}
