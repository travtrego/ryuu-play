import {
  AddSpecialConditionsEffect,
  CardType,
  CheckPokemonTypeEffect,
  Effect,
  EnergyCard,
  EnergyType,
  PlayerType,
  PokemonSlot,
  State,
  StoreLike,
} from '@ptcg/common';

export class BubblyWaterEnergy extends EnergyCard {
  public provides: CardType[] = [CardType.WATER];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'CRI';

  public name: string = 'Bubbly Water Energy';

  public fullName: string = 'Bubbly Water Energy CRI';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides W Energy. The W Pokémon this card is attached ' +
    'to recovers from all Special Conditions and can\'t be affected by any Special Conditions.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckPokemonTypeEffect) {
      return state;
    }

    if (effect instanceof AddSpecialConditionsEffect
      && effect.target.energies.cards.includes(this)
      && this.isWater(store, state, effect.target)) {
      effect.preventDefault = true;
      return state;
    }

    // "Recovers": checked on every effect (as Festival Grounds), so a
    // condition the Pokémon had before this card was attached, or before it
    // became a W Pokémon, is removed before it can do anything.
    for (const player of state.players) {
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, slot => {
        if (slot.specialConditions.length > 0
          && slot.energies.cards.includes(this)
          && this.isWater(store, state, slot)) {
          slot.specialConditions = [];
        }
      });
    }

    return state;
  }

  private isWater(store: StoreLike, state: State, slot: PokemonSlot): boolean {
    const checkType = new CheckPokemonTypeEffect(slot);
    store.reduceEffect(state, checkType);
    return checkType.cardTypes.includes(CardType.WATER);
  }
}
