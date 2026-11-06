import {
  Effect,
  ShuffleDeckPrompt,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class Judge extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'POR';

  public name: string = 'Judge';

  public fullName: string = 'Judge POR';

  public text: string = 'Each player shuffles their hand into their deck and draws 4 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const cards = player.hand.cards.filter(c => c !== this);
      player.hand.moveCardsTo(cards, player.deck);
      opponent.hand.moveTo(opponent.deck);

      return store.prompt(state, [new ShuffleDeckPrompt(player.id), new ShuffleDeckPrompt(opponent.id)], orders => {
        player.deck.applyOrder(orders[0]);
        opponent.deck.applyOrder(orders[1]);
        player.deck.moveTo(player.hand, 4);
        opponent.deck.moveTo(opponent.hand, 4);
      });
    }

    return state;
  }
}
