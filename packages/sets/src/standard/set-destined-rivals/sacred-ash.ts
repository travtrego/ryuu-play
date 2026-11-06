import {
  ChooseCardsPrompt,
  Effect,
  GameError,
  GameMessage,
  PokemonCard,
  ShuffleDeckPrompt,
  State,
  StoreLike,
  SuperType,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class SacredAsh extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'DRI';

  public name: string = 'Sacred Ash';

  public fullName: string = 'Sacred Ash DRI';

  public text: string = 'Shuffle 5 Pokémon from your discard pile into your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const pokemonCount = player.discard.cards.filter(c => c instanceof PokemonCard).length;
      if (pokemonCount === 0) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      // With fewer than 5 Pokémon in the discard pile, all of them.
      const count = Math.min(5, pokemonCount);
      return store.prompt(state, new ChooseCardsPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_DECK,
        player.discard,
        { superType: SuperType.POKEMON },
        { min: count, max: count, allowCancel: false }
      ), selected => {
        player.discard.moveCardsTo(selected || [], player.deck);
        store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
          player.deck.applyOrder(order);
        });
      });
    }
    return state;
  }
}
