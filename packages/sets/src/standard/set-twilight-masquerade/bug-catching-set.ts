import {
  Card,
  CardList,
  CardType,
  ChooseCardsPrompt,
  Effect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  PokemonCard,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function isBugCatchingSetTarget(card: Card): boolean {
  if (card instanceof PokemonCard) {
    return card.cardTypes.includes(CardType.GRASS);
  }

  return card instanceof EnergyCard
    && card.energyType === EnergyType.BASIC
    && card.provides.includes(CardType.GRASS);
}

function* playCard(
  next: Function,
  store: StoreLike,
  state: State,
  effect: TrainerEffect
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);
  const lookedAt = new CardList();
  let cards: Card[] = [];

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  player.deck.moveTo(lookedAt, 7);
  const eligible = lookedAt.cards.filter(isBugCatchingSetTarget);

  if (eligible.length > 0) {
    const searchPool = new CardList();
    searchPool.cards = eligible;

    yield store.prompt(
      state,
      new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_HAND,
        searchPool,
        {},
        { min: 0, max: Math.min(2, eligible.length), allowCancel: true }
      ),
      selected => {
        cards = selected || [];
        next();
      }
    );
  }

  if (cards.length > 0) {
    yield store.prompt(
      state,
      new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
      () => next()
    );
  }

  lookedAt.moveCardsTo(cards, player.hand);
  lookedAt.moveTo(player.deck);

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class BugCatchingSet extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'TWM';

  public name: string = 'Bug Catching Set';

  public fullName: string = 'Bug Catching Set TWM';

  public text: string =
    'Look at the top 7 cards of your deck. You may reveal up to 2 in any combination of Grass Pokémon and ' +
    'Basic Grass Energy cards you find there and put them into your hand. Shuffle the other cards back into your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
