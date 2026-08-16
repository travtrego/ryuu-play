import {
  Card,
  ChooseCardsPrompt,
  Effect,
  EnergyType,
  GameError,
  GameMessage,
  State,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class NightStretcher extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'SFA';

  public name: string = 'Night Stretcher';

  public fullName: string = 'Night Stretcher SFA';

  public text: string = 'Put a Pokémon or a Basic Energy card from your discard pile into your hand.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const filter = [
        { superType: SuperType.POKEMON },
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
      ];
      const eligible = player.discard.cards.filter(card =>
        card.superType === SuperType.POKEMON
          || (card.superType === SuperType.ENERGY && (card as any).energyType === EnergyType.BASIC)
      );

      if (eligible.length === 0) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      let cards: Card[] = [];
      store.prompt(
        state,
        new ChooseCardsPrompt(
          player.id,
          GameMessage.CHOOSE_CARD_TO_HAND,
          player.discard,
          filter,
          { min: 1, max: 1, allowCancel: false }
        ),
        selected => {
          cards = selected || [];
          player.discard.moveCardsTo(cards, player.hand);
        }
      );
    }

    return state;
  }
}
