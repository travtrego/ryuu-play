import {
  Card,
  CardList,
  CardTag,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(
  next: Function,
  store: StoreLike,
  state: State,
  self: SecretBox,
  effect: TrainerEffect
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);

  const others = player.hand.cards.filter(c => c !== self);
  if (others.length < 3) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // The card goes to the discard pile only once the cost is paid.
  effect.preventDefault = true;

  const handTemp = new CardList();
  handTemp.cards = others;
  let discarded: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_DISCARD,
    handTemp,
    {},
    { min: 3, max: 3, allowCancel: true }
  ), selected => {
    discarded = selected || [];
    next();
  });

  if (discarded.length === 0) {
    return state;
  }

  player.hand.moveCardTo(self, player.discard);
  player.hand.moveCardsTo(discarded, player.discard);

  const found: Card[] = [];
  for (const trainerType of [TrainerType.ITEM, TrainerType.TOOL, TrainerType.SUPPORTER, TrainerType.STADIUM]) {
    yield store.prompt(state, new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      player.deck,
      { superType: SuperType.TRAINER, trainerType },
      { min: 0, max: 1, allowCancel: false }
    ), selected => {
      const cards = selected || [];
      player.deck.moveCardsTo(cards, player.hand);
      found.push(...cards);
      next();
    });
  }

  if (found.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, found),
      () => next());
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class SecretBox extends TrainerCard {
  public tags = [CardTag.ACE_SPEC];

  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'TWM';

  public name: string = 'Secret Box';

  public fullName: string = 'Secret Box TWM';

  public text: string =
    'You can use this card only if you discard 3 other cards from your hand. Search your deck for an Item ' +
    'card, a Pokémon Tool card, a Supporter card, and a Stadium card, reveal them, and put them into your ' +
    'hand. Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, this, effect);
      return generator.next().value;
    }
    return state;
  }
}
