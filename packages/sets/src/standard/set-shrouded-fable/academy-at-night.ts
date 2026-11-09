import {
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameLog,
  GameMessage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
  UseStadiumEffect,
} from '@ptcg/common';

export class AcademyAtNight extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'SFA';

  public name: string = 'Academy at Night';

  public fullName: string = 'Academy at Night SFA';

  public text: string =
    'Once during each player\'s turn, that player may put a card from their hand on top of their deck.';

  public useWhenInPlay = true;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof UseStadiumEffect && StateUtils.getStadiumCard(state) === this) {
      const player = effect.player;
      if (player.hand.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_STADIUM);
      }

      // The stadium counts as used only once a card is chosen.
      effect.preventDefault = true;
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_DECK,
        player.hand,
        {},
        { min: 1, max: 1, allowCancel: true }
      ), selected => {
        const cards = selected || [];
        if (cards.length === 0) {
          return;
        }
        store.log(state, GameLog.LOG_PLAYER_USES_STADIUM, { name: player.name, stadium: this.name });
        player.stadiumUsedTurn = state.turn;
        player.hand.moveCardsToTop(cards, player.deck);
      });
    }

    return state;
  }
}
