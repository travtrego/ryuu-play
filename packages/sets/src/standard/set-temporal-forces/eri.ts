import {
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  State,
  StateUtils,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class Eri extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'TEF';

  public name: string = 'Eri';

  public fullName: string = 'Eri TEF';

  public text: string = 'Your opponent reveals their hand, and you discard up to 2 Item cards you find there.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      if (opponent.hand.cards.length === 0) {
        return state;
      }
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_DISCARD,
        opponent.hand,
        { superType: SuperType.TRAINER, trainerType: TrainerType.ITEM },
        { min: 0, max: 2, allowCancel: false }
      ), selected => {
        opponent.hand.moveCardsTo(selected || [], opponent.discard);
      });
    }
    return state;
  }
}
