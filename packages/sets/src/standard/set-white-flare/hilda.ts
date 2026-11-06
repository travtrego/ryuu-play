import {
  Card,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Stage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);
  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const found: Card[] = [];

  // An Evolution Pokémon (Stage 1 or Stage 2).
  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    if (!(card instanceof PokemonCard) || (card.stage !== Stage.STAGE_1 && card.stage !== Stage.STAGE_2)) {
      blocked.push(index);
    }
  });
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id, GameMessage.CHOOSE_CARD_TO_HAND, player.deck,
    { superType: SuperType.POKEMON }, { min: 0, max: 1, allowCancel: true, blocked }
  ), selected => {
    const cards = selected || [];
    player.deck.moveCardsTo(cards, player.hand);
    found.push(...cards);
    next();
  });

  // An Energy card.
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id, GameMessage.CHOOSE_CARD_TO_HAND, player.deck,
    { superType: SuperType.ENERGY }, { min: 0, max: 1, allowCancel: true }
  ), selected => {
    const cards = selected || [];
    player.deck.moveCardsTo(cards, player.hand);
    found.push(...cards);
    next();
  });

  if (found.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, found),
      () => next());
  }
  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Hilda extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'WHT';

  public name: string = 'Hilda';

  public fullName: string = 'Hilda WHT';

  public text: string =
    'Search your deck for an Evolution Pokémon and an Energy card, reveal them, and put them into your hand. ' +
    'Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
