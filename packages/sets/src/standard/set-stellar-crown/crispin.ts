import {
  AttachEnergyPrompt,
  Card,
  CardList,
  ChooseCardsPrompt,
  Effect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  PlayerType,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  SlotType,
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

  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.deck,
    { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
    { min: 0, max: 2, allowCancel: true, differentTypes: true }
  ), selected => {
    cards = selected || [];
    next();
  });

  if (cards.length > 0) {
    yield store.prompt(state, new ShowCardsPrompt(opponent.id, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT, cards),
      () => next());
  }

  if (cards.length === 2) {
    // Choose which of the two to attach; the other goes to the hand.
    const found = new CardList();
    player.deck.moveCardsTo(cards, found);
    yield store.prompt(state, new AttachEnergyPrompt(
      player.id,
      GameMessage.ATTACH_ENERGY_CARDS,
      found,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.ACTIVE, SlotType.BENCH],
      { superType: SuperType.ENERGY },
      { min: 1, max: 1, allowCancel: false }
    ), transfers => {
      const list = transfers || [];
      if (list.length > 0) {
        const target = StateUtils.getTarget(state, player, list[0].to);
        found.moveCardTo(list[0].card as EnergyCard, target.energies);
      }
      found.moveTo(player.hand);
      next();
    });
  } else {
    player.deck.moveCardsTo(cards, player.hand);
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class Crispin extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'SCR';

  public name: string = 'Crispin';

  public fullName: string = 'Crispin SCR';

  public text: string =
    'Search your deck for up to 2 Basic Energy cards of different types, reveal them, and put 1 of them into ' +
    'your hand. Attach the other to 1 of your Pokémon. Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
