import {
  CardTag,
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  State,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class MiracleHeadset extends TrainerCard {
  public tags = [CardTag.ACE_SPEC];

  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'SSP';

  public name: string = 'Miracle Headset';

  public fullName: string = 'Miracle Headset SSP';

  public text: string = 'Put up to 2 Supporter cards from your discard pile into your hand.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const supporters = player.discard.cards.filter(card =>
        card instanceof TrainerCard && card.trainerType === TrainerType.SUPPORTER
      );

      if (supporters.length === 0) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      return store.prompt(
        state,
        new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_HAND,
          player.discard,
          { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER },
          { min: 1, max: Math.min(2, supporters.length), allowCancel: false }
        ),
        selected => {
          player.discard.moveCardsTo(selected || [], player.hand);
        }
      );
    }

    return state;
  }
}
