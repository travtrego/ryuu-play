import {
  Card,
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
  Stage,
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

  if (player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  const blocked: number[] = [];
  player.deck.cards.forEach((card, index) => {
    if (!isWanted(card)) {
      blocked.push(index);
    }
  });

  let cards: Card[] = [];
  if (blocked.length < player.deck.cards.length) {
    yield store.prompt(state, new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_HAND,
      player.deck,
      {},
      { min: 0, max: 1, allowCancel: true, blocked }
    ), selected => {
      cards = selected || [];
      next();
    });
  }

  if (cards.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
      () => next());
    player.deck.moveCardsTo(cards, player.hand);
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

function isWanted(card: Card): boolean {
  if (card instanceof EnergyCard) {
    return card.energyType === EnergyType.BASIC && card.provides.includes(CardType.FIGHTING);
  }
  return card instanceof PokemonCard && card.stage === Stage.BASIC && card.cardTypes.includes(CardType.FIGHTING);
}

export class FightingGong extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'MEG';

  public name: string = 'Fighting Gong';

  public fullName: string = 'Fighting Gong MEG';

  public text: string =
    'Search your deck for a Basic F Energy card or a Basic F Pokémon, reveal it, and put it into your hand. ' +
    'Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
