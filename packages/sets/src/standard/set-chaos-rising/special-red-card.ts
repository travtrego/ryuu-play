import {
  Effect,
  GameError,
  GameMessage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class SpecialRedCard extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'CRI';

  public name: string = 'Special Red Card';

  public fullName: string = 'Special Red Card CRI';

  public text: string =
    'You can use this card only if your opponent has 3 or fewer Prize cards remaining. Your opponent shuffles ' +
    'their hand and puts it on the bottom of their deck. If they put any cards on the bottom of their deck in ' +
    'this way, they draw 3 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      if (opponent.getPrizeLeft() > 3) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      const count = opponent.hand.cards.length;
      if (count === 0) {
        return state;
      }
      // The hand goes under the deck. It is not shuffled first: the engine has
      // no shuffle for a hand, and nobody can see that order anyway.
      opponent.hand.moveTo(opponent.deck);
      opponent.deck.moveTo(opponent.hand, 3);
    }
    return state;
  }
}
