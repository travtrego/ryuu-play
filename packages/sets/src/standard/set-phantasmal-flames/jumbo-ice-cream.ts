import {
  Effect,
  GameError,
  GameMessage,
  HealEffect,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class JumboIceCream extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'PFL';

  public name: string = 'Jumbo Ice Cream';

  public fullName: string = 'Jumbo Ice Cream PFL';

  public text: string = 'Heal 80 damage from your Active Pokémon that has 3 or more Energy attached.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      // Engine convention (as with Potion): an Item that would do nothing
      // can't be played.
      if (player.active.energies.cards.length < 3 || player.active.damage === 0) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      store.reduceEffect(state, new HealEffect(player, player.active, 80));
    }
    return state;
  }
}
