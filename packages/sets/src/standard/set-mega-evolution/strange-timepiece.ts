import {
  CardTarget,
  CardType,
  CheckPokemonTypeEffect,
  ChoosePokemonPrompt,
  Effect,
  GameError,
  GameMessage,
  PlayerType,
  PokemonCard,
  PokemonSlot,
  SelectPrompt,
  SlotType,
  Stage,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

/**
 * How many Evolution cards can come off the top of this Pokémon, keeping at
 * least one card in play (the Basic Pokémon).
 */
export function removableEvolutionCount(slot: PokemonSlot): number {
  const cards = slot.pokemons.cards;
  let count = 0;
  for (let i = cards.length - 1; i >= 1; i--) {
    if (cards[i].stage !== Stage.STAGE_1 && cards[i].stage !== Stage.STAGE_2) {
      break;
    }
    count += 1;
  }
  return count;
}

function isPsychic(store: StoreLike, state: State, slot: PokemonSlot): boolean {
  const checkType = new CheckPokemonTypeEffect(slot);
  store.reduceEffect(state, checkType);
  return checkType.cardTypes.includes(CardType.PSYCHIC);
}

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  const blocked: CardTarget[] = [];
  let canDevolve = false;
  player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card, target) => {
    if (removableEvolutionCount(slot) > 0 && isPsychic(store, state, slot)) {
      canDevolve = true;
    } else {
      blocked.push(target);
    }
  });
  if (!canDevolve) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // The card goes to the discard pile once a Pokémon is chosen.
  effect.preventDefault = true;

  let slot: PokemonSlot | undefined;
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_PICK_UP,
    PlayerType.BOTTOM_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { allowCancel: true, blocked }
  ), result => {
    slot = result && result.length > 0 ? result[0] : undefined;
    next();
  });
  if (slot === undefined) {
    return state;
  }
  const target = slot;

  // "any number of Evolution cards on it": 1 takes the top card, 2 the top two.
  const max = removableEvolutionCount(target);
  let count = 1;
  if (max > 1) {
    const cards = target.pokemons.cards;
    // Option i leaves the card under the top (i + 1) cards on top.
    const values = Array.from({ length: max }, (_, i) => cards[cards.length - 2 - i].name);
    yield store.prompt(state, new SelectPrompt(
      player.id,
      GameMessage.CHOOSE_OPTION,
      values,
      { allowCancel: false }
    ), choice => {
      const index = typeof choice === 'number' ? choice : 0;
      count = Math.max(0, Math.min(index, max - 1)) + 1;
      next();
    });
  }

  player.hand.moveCardTo(effect.trainerCard, player.discard);

  const removed: PokemonCard[] = target.pokemons.cards.slice(target.pokemons.cards.length - count);
  target.pokemons.moveCardsTo(removed, player.hand);
  // Devolving, like evolving, ends Special Conditions and other effects.
  // Damage counters stay; checkState Knocks the Pokémon Out if its HP is now
  // too low. "(That Pokémon can't evolve this turn.)"
  target.clearEffects();
  target.pokemonPlayedTurn = state.turn;

  return state;
}

/** Strange Timepiece — Mega Evolution 128/132. */
export class StrangeTimepiece extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'MEG';

  public name: string = 'Strange Timepiece';

  public fullName: string = 'Strange Timepiece MEG';

  public text: string =
    'Devolve 1 of your evolved P Pokémon by putting any number of Evolution cards on it into your hand. ' +
    '(That Pokémon can\'t evolve this turn.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
