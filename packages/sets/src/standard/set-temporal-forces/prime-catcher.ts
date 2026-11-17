import {
  CardTag,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  PokemonSlot,
  SlotType,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  let opponentTarget: PokemonSlot | undefined;
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_SWITCH,
    PlayerType.TOP_PLAYER,
    [SlotType.BENCH],
    { allowCancel: false }
  ), result => {
    opponentTarget = result && result.length > 0 ? result[0] : undefined;
    next();
  });
  if (opponentTarget === undefined) {
    return state;
  }
  opponent.switchPokemon(opponentTarget);

  // "If you do, switch your Active Pokémon with 1 of your Benched Pokémon."
  if (!player.bench.some(b => b.pokemons.cards.length > 0)) {
    return state;
  }
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_SWITCH,
    PlayerType.BOTTOM_PLAYER,
    [SlotType.BENCH],
    { allowCancel: false }
  ), result => {
    if (result && result.length > 0) {
      player.switchPokemon(result[0]);
    }
    next();
  });

  return state;
}

/** Prime Catcher — Temporal Forces 157/162 (ACE SPEC). */
export class PrimeCatcher extends TrainerCard {
  public tags = [CardTag.ACE_SPEC];

  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'TEF';

  public name: string = 'Prime Catcher';

  public fullName: string = 'Prime Catcher TEF';

  public text: string =
    'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. If you do, switch your Active Pokémon ' +
    'with 1 of your Benched Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      if (!opponent.bench.some(b => b.pokemons.cards.length > 0)) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
