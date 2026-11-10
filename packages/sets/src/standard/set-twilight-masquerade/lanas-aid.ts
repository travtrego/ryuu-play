import {
  Card,
  ChooseCardsPrompt,
  Effect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  PokemonCard,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class LanasAid extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'TWM';

  public name: string = 'Lana\'s Aid';

  public fullName: string = 'Lana\'s Aid TWM';

  public text: string =
    'Put up to 3 in any combination of Pokémon that don\'t have a Rule Box and Basic Energy cards from your ' +
    'discard pile into your hand. (Pokémon ex, Pokémon V, etc. have Rule Boxes.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const blocked: number[] = [];
      player.discard.cards.forEach((card, index) => {
        const ok = (card instanceof PokemonCard && !StateUtils.hasRuleBox(card))
          || (card instanceof EnergyCard && card.energyType === EnergyType.BASIC);
        if (!ok) {
          blocked.push(index);
        }
      });

      if (blocked.length === player.discard.cards.length) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.discard,
        {},
        { min: 1, max: 3, allowCancel: false, blocked }
      ), selected => {
        const cards: Card[] = selected || [];
        player.discard.moveCardsTo(cards, player.hand);
      });
    }

    return state;
  }
}
