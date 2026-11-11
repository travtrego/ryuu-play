import {
  CardTag,
  CheckTableStateEffect,
  Effect,
  PlayerType,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class AreaZeroUnderdepths extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'SCR';

  public name: string = 'Area Zero Underdepths';

  public fullName: string = 'Area Zero Underdepths SCR';

  public text: string =
    'Each player who has any Tera Pokémon in play can have up to 8 Pokémon on their Bench. If a player no ' +
    'longer has any Tera Pokémon in play, that player discards Pokémon from their Bench until they have 5. ' +
    'When this card leaves play, both players discard Pokémon from their Bench until they have 5, and the ' +
    'player who played this card discards first.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // The engine sizes each Bench from CheckTableStateEffect at every check;
    // when a player loses their last Tera Pokémon, or this card leaves play,
    // the size drops back to 5 and the engine asks that player to discard.
    if (effect instanceof CheckTableStateEffect && StateUtils.getStadiumCard(state) === this) {
      state.players.forEach((player, index) => {
        let hasTera = false;
        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card) => {
          if (card.tags.includes(CardTag.TERA)) {
            hasTera = true;
          }
        });
        if (hasTera) {
          effect.benchSizes[index] = Math.max(8, effect.benchSizes[index] ?? effect.benchSize);
        }
      });
    }
    return state;
  }
}
