import {
  Card,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  PokemonSlot,
  ShuffleDeckPrompt,
  Stage,
  State,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const slots: PokemonSlot[] = player.bench.filter(b => b.pokemons.cards.length === 0);

  if (slots.length === 0 || player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // Only Basic Pokémon with 70 HP or less.
  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    if (!(card instanceof PokemonCard) || card.stage !== Stage.BASIC || card.hp > 70) {
      blocked.push(index);
    }
  });

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
    player.deck,
    { superType: SuperType.POKEMON, stage: Stage.BASIC },
    { min: 0, max: Math.min(2, slots.length), allowCancel: true, blocked }
  ), selected => {
    cards = selected || [];
    next();
  });

  cards.slice(0, slots.length).forEach((card, index) => {
    player.deck.moveCardTo(card, slots[index].pokemons);
    slots[index].pokemonPlayedTurn = state.turn;
  });

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class BuddyBuddyPoffin extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'TEF';

  public name: string = 'Buddy-Buddy Poffin';

  public fullName: string = 'Buddy-Buddy Poffin TEF';

  public text: string =
    'Search your deck for up to 2 Basic Pokémon with 70 HP or less and put them onto your Bench. ' +
    'Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
