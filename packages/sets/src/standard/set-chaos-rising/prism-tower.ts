import {
  Card,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
  UseStadiumEffect,
} from '@ptcg/common';

function* useStadium(
  next: Function,
  store: StoreLike,
  state: State,
  effect: UseStadiumEffect
): IterableIterator<State> {
  const player = effect.player;
  const stadiumUsedTurn = player.stadiumUsedTurn;
  let cards: Card[] = [];

  if (player.hand.cards.length < 2 || player.deck.cards.length === 0) {
    throw new GameError(GameMessage.CANNOT_USE_STADIUM);
  }

  yield store.prompt(
    state,
    new ChooseCardsPrompt(
      player.id,
      GameMessage.CHOOSE_CARD_TO_DISCARD,
      player.hand,
      {},
      { min: 2, max: 2, allowCancel: true }
    ),
    selected => {
      cards = selected || [];
      next();
    }
  );

  if (cards.length === 0) {
    // UseStadiumAction marks the stadium as used before the card effect runs.
    // A cancelled optional activation must restore that per-turn flag.
    player.stadiumUsedTurn = stadiumUsedTurn;
    return state;
  }

  player.hand.moveCardsTo(cards, player.discard);
  player.deck.moveTo(player.hand, 1);

  return state;
}

export class PrismTower extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'CRI';

  public name: string = 'Prism Tower';

  public fullName: string = 'Prism Tower CRI';

  public text: string =
    'Once during each player\'s turn, that player may discard 2 cards from their hand in order to draw a card.';

  public useWhenInPlay: boolean = true;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof UseStadiumEffect && StateUtils.getStadiumCard(state) === this) {
      const generator = useStadium(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
