import {
  Effect,
  GameError,
  GameMessage,
  ShuffleDeckPrompt,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

/**
 * Lillie's Determination — Mega Evolution 119/132
 *
 * Shuffle your hand into your deck. Then, draw 6 cards. If you have exactly
 * 6 Prize cards remaining, draw 8 cards instead.
 */
export class LilliesDetermination extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'MEG';

  public name: string = "Lillie's Determination";

  public fullName: string = "Lillie's Determination MEG";

  public text: string =
    'Shuffle your hand into your deck. Then, draw 6 cards. If you have exactly ' +
    '6 Prize cards remaining, draw 8 cards instead.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const cards = player.hand.cards.filter(card => card !== this);

      if (cards.length === 0 && player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      const drawCount = player.getPrizeLeft() === 6 ? 8 : 6;
      player.hand.moveCardsTo(cards, player.deck);

      return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
        player.deck.applyOrder(order);
        player.deck.moveTo(player.hand, drawCount);
      });
    }

    return state;
  }
}
