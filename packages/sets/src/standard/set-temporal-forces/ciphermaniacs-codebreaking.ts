import {
  Card,
  CardList,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  OrderCardsPrompt,
  ShuffleDeckPrompt,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const count = Math.min(2, player.deck.cards.length);
  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_DECK,
    player.deck,
    {},
    { min: count, max: count, allowCancel: false }
  ), selected => {
    cards = selected || [];
    next();
  });

  const chosen = new CardList();
  player.deck.moveCardsTo(cards, chosen);

  yield store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
    next();
  });

  if (chosen.cards.length > 1) {
    yield store.prompt(state, new OrderCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARDS_ORDER,
      chosen,
      { allowCancel: false }
    ), order => {
      if (order !== null && order !== undefined) {
        chosen.applyOrder(order);
      }
      next();
    });
  }

  // The first card of the chosen order ends up on top.
  chosen.moveToTop(player.deck);
  return state;
}

export class CiphermaniacsCodebreaking extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'TEF';

  public name: string = 'Ciphermaniac\'s Codebreaking';

  public fullName: string = 'Ciphermaniac\'s Codebreaking TEF';

  public text: string =
    'Search your deck for 2 cards, shuffle your deck, then put those cards on top of it in any order.';

  public reduceEffect(store: StoreLike, state: State, effect: TrainerEffect | Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
