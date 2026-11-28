import {
  Card,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  Effect,
  EnergyCard,
  GameError,
  GameMessage,
  PlayerType,
  PokemonSlot,
  SlotType,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  let targets: PokemonSlot[] = [];
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_SWITCH,
    PlayerType.BOTTOM_PLAYER,
    [SlotType.BENCH],
    { allowCancel: false }
  ), result => {
    targets = result || [];
    next();
  });
  if (targets.length === 0) {
    return state;
  }

  const moved = player.active;
  player.switchPokemon(targets[0]);

  // "If you do, move an Energy from the Pokémon you moved to your Bench to
  // the new Active Pokémon."
  if (moved.energies.cards.length === 0) {
    return state;
  }
  let cards: Card[] = [moved.energies.cards[0]];
  if (moved.energies.cards.length > 1) {
    yield store.prompt(state, new ChooseCardsPrompt(
      player.id,
      GameMessage.MOVE_ENERGY_TO_ACTIVE,
      moved.energies,
      {},
      { min: 1, max: 1, allowCancel: false }
    ), selected => {
      cards = selected && selected.length > 0 ? selected : cards;
      next();
    });
  }
  moved.energies.moveCardsTo(cards as EnergyCard[], player.active.energies);
  return state;
}

/** Zinnia's Trust — Delta Reign 103 (Supporter). */
export class ZinniasTrust extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'DLR';

  public name: string = 'Zinnia\'s Trust';

  public fullName: string = 'Zinnia\'s Trust DLR';

  public text: string = 'Switch your Active Pokémon with 1 of your Benched Pokémon. If you do, move an Energy ' +
    'from the Pokémon you moved to your Bench to the new Active Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      if (!player.bench.some(b => b.pokemons.cards.length > 0)) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
