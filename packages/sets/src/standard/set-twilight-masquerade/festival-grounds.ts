import {
  AddSpecialConditionsEffect,
  Effect,
  PlayerType,
  PokemonSlot,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class FestivalGrounds extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'TWM';

  public name: string = 'Festival Grounds';

  public fullName: string = 'Festival Grounds TWM';

  public text: string =
    'Pokémon that have any Energy attached can\'t be affected by any Special Conditions, and they recover ' +
    'from all Special Conditions.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (StateUtils.getStadiumCard(state) !== this) {
      return state;
    }

    if (effect instanceof AddSpecialConditionsEffect && hasEnergy(effect.target)) {
      effect.preventDefault = true;
    }

    // "They recover": checked on every effect, so a condition placed some
    // other way, or one a Pokémon had before it got Energy, is removed before
    // it can do anything (Poison and Burn between turns, Asleep, Paralyzed).
    for (const player of state.players) {
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, slot => {
        if (slot.specialConditions.length > 0 && hasEnergy(slot)) {
          slot.specialConditions = [];
        }
      });
    }

    return state;
  }
}

function hasEnergy(slot: PokemonSlot): boolean {
  return slot.energies.cards.length > 0;
}
