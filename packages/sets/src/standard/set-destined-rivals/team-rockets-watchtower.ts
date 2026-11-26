import {
  CardType,
  CheckPokemonTypeEffect,
  Effect,
  GameError,
  GameMessage,
  PowerEffect,
  PokemonSlot,
  PowerType,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class TeamRocketsWatchtower extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Watchtower';

  public fullName: string = 'Team Rocket\'s Watchtower DRI';

  public text: string = 'C Pokémon in play (both yours and your opponent\'s) have no Abilities.';

  /**
   * True when a Team Rocket's Watchtower in play takes away the Abilities of
   * the Pokémon in `slot` (it is a C Pokémon). For effects that ask whether a
   * Pokémon "has an Ability" (Froslass's Freezing Shroud).
   */
  public static removesAbilities(store: StoreLike, state: State, slot: PokemonSlot): boolean {
    if (!(StateUtils.getStadiumCard(state) instanceof TeamRocketsWatchtower)) {
      return false;
    }
    const checkType = new CheckPokemonTypeEffect(slot);
    store.reduceEffect(state, checkType);
    return checkType.cardTypes.includes(CardType.COLORLESS);
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect
      && effect.power.powerType === PowerType.ABILITY
      && StateUtils.getStadiumCard(state) === this) {
      const slot = StateUtils.findPokemonSlot(state, effect.card);
      if (slot === undefined) {
        return state; // not in play (e.g. an Ability used from the hand)
      }
      const checkType = new CheckPokemonTypeEffect(slot);
      store.reduceEffect(state, checkType);
      if (checkType.cardTypes.includes(CardType.COLORLESS)) {
        throw new GameError(GameMessage.BLOCKED_BY_ABILITY);
      }
    }
    return state;
  }
}
