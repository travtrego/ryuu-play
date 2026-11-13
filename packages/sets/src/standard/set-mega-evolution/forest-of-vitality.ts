import {
  CardType,
  CheckPokemonPlayedTurnEffect,
  CheckPokemonTypeEffect,
  Effect,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class ForestOfVitality extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'MEG';

  public name: string = 'Forest of Vitality';

  public fullName: string = 'Forest of Vitality MEG';

  public text: string =
    'Each player\'s G Pokémon may evolve into a G Pokémon during the turn they play those Pokémon (except ' +
    'during their first turn).';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // The engine asks for the turn a Pokémon was played before it evolves;
    // `evolvesInto` is set for a normal evolution from the hand (not Rare Candy).
    if (effect instanceof CheckPokemonPlayedTurnEffect
      && effect.evolvesInto !== undefined
      && StateUtils.getStadiumCard(state) === this) {
      // Turns 1 and 2 are the first turns of the two players.
      if (state.turn <= 2 || effect.pokemonPlayedTurn < state.turn) {
        return state;
      }
      if (!effect.evolvesInto.cardTypes.includes(CardType.GRASS)) {
        return state;
      }
      const checkType = new CheckPokemonTypeEffect(effect.target);
      store.reduceEffect(state, checkType);
      if (!checkType.cardTypes.includes(CardType.GRASS)) {
        return state;
      }
      effect.pokemonPlayedTurn = state.turn - 1;
    }
    return state;
  }
}
