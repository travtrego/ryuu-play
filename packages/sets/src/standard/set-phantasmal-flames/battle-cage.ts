import {
  Effect,
  PokemonSlot,
  Player,
  PutCountersEffect,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class BattleCage extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'PFL';

  public name: string = 'Battle Cage';

  public fullName: string = 'Battle Cage PFL';

  public text: string =
    'Prevent all damage counters from being placed on Benched Pokémon (both yours and your opponent\'s) by ' +
    'effects of attacks and Abilities from the opponent\'s Pokémon. (Damage from attacks is still taken.)';

  /**
   * For Abilities that place damage counters: false when Battle Cage is in play
   * and the target is a Benched Pokémon of the other player.
   */
  public static allowsCounters(state: State, player: Player, target: PokemonSlot): boolean {
    const stadium = StateUtils.getStadiumCard(state);
    if (!(stadium instanceof BattleCage)) {
      return true;
    }
    const owner = StateUtils.findOwner(state, target);
    return owner === player || owner.active === target;
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutCountersEffect && StateUtils.getStadiumCard(state) === this
      && !BattleCage.allowsCounters(state, effect.player, effect.target)) {
      effect.preventDefault = true;
    }
    return state;
  }
}
