import {
  CardType,
  DealDamageEffect,
  Effect,
  PlayerType,
  PokemonCard,
  PowerEffect,
  PowerType,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';
import { isCynthiasPokemon } from './cynthia-utils';

export class CynthiasRoserade extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Cynthia\'s Roselia';

  public cardTypes: CardType[] = [CardType.GRASS];

  public hp: number = 130;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public powers = [
    {
      name: 'Cheer On to Glory',
      powerType: PowerType.ABILITY,
      text: 'Attacks used by your Cynthia\'s Pokémon do 30 more damage to your opponent\'s Active Pokémon ' +
        '(before applying Weakness and Resistance).',
    },
  ];

  public attacks = [
    {
      name: 'Leaf Step',
      cost: [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS],
      damage: '80',
      text: '',
    },
  ];

  public set: string = 'DRI';

  public name: string = 'Cynthia\'s Roserade';

  public fullName: string = 'Cynthia\'s Roserade DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof DealDamageEffect) {
      const player = effect.player;
      if (effect.target !== effect.opponent.active || effect.damage <= 0
        || !isCynthiasPokemon(effect.source.getPokemonCard())) {
        return state;
      }
      // Only while this Roserade is in play on the attacker's side. Each
      // Roserade in play adds its own 30.
      let inPlay = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card) => {
        if (card === this) {
          inPlay = true;
        }
      });
      if (!inPlay) {
        return state;
      }
      try {
        store.reduceEffect(state, new PowerEffect(player, this.powers[0], this));
      } catch {
        return state;
      }
      effect.damage += 30;
      return state;
    }

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      // A passive Ability: only checked (see above), never used.
      return state;
    }

    return state;
  }
}
