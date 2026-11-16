import {
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

export class TeamRocketsArcher extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Archer';

  public fullName: string = 'Team Rocket\'s Archer DRI';

  public text: string =
    'You can use this card only if any of your Team Rocket\'s Pokémon were Knocked Out during your ' +
    'opponent\'s last turn. Each player shuffles their hand into their deck. Then, you draw 5 cards, and your ' +
    'opponent draws 3 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (!StateUtils.wasKnockedOutLastTurnMatching(state, player, name => name.startsWith('Team Rocket\'s '))) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      const cards = player.hand.cards.filter(c => c !== this);
      player.hand.moveCardsTo(cards, player.deck);
      opponent.hand.moveTo(opponent.deck);

      return store.prompt(state, [new ShuffleDeckPrompt(player.id), new ShuffleDeckPrompt(opponent.id)], orders => {
        player.deck.applyOrder(orders[0]);
        opponent.deck.applyOrder(orders[1]);
        player.deck.moveTo(player.hand, 5);
        opponent.deck.moveTo(opponent.hand, 3);
      });
    }

    return state;
  }
}
