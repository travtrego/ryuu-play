import {
  CardTag,
  Effect,
  GameError,
  GameMessage,
  ShuffleDeckPrompt,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class UnfairStamp extends TrainerCard {
  public tags = [CardTag.ACE_SPEC];

  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'TWM';

  public name: string = 'Unfair Stamp';

  public fullName: string = 'Unfair Stamp TWM';

  public text: string =
    'You can use this card only if any of your Pokémon were Knocked Out during your opponent\'s last turn. ' +
    'Each player shuffles their hand into their deck. Then, you draw 5 cards, and your opponent draws 2 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (!StateUtils.wasKnockedOutLastTurn(state, player)) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      const cards = player.hand.cards.filter(c => c !== this);
      player.hand.moveCardsTo(cards, player.deck);
      opponent.hand.moveTo(opponent.deck);

      return store.prompt(state, [new ShuffleDeckPrompt(player.id), new ShuffleDeckPrompt(opponent.id)], orders => {
        player.deck.applyOrder(orders[0]);
        opponent.deck.applyOrder(orders[1]);
        player.deck.moveTo(player.hand, 5);
        opponent.deck.moveTo(opponent.hand, 2);
      });
    }

    return state;
  }
}
