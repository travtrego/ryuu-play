import {
  CardType,
  CheckPokemonTypeEffect,
  CheckTableStateEffect,
  Effect,
  EndTurnEffect,
  GamePhase,
  PlayStadiumEffect,
  PlayerType,
  Stage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

/**
 * Marks, on its owner, a Pokémon that was already in play when the turn began
 * (or when Risky Ruins came into play), so only Pokémon put onto the Bench
 * after that get the 2 damage counters.
 */
const RISKY_RUINS_SEEN = 'RISKY_RUINS_SEEN';

export class RiskyRuins extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'MEG';

  public name: string = 'Risky Ruins';

  public fullName: string = 'Risky Ruins MEG';

  public text: string =
    'Whenever any player puts a Basic non-D Pokémon onto their Bench during their turn, place 2 damage ' +
    'counters on that Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PlayStadiumEffect && effect.trainerCard === this) {
      this.markAllInPlay(state);
      return state;
    }

    // A new turn begins: everything in play now was not put onto the Bench during it.
    if (effect instanceof EndTurnEffect) {
      this.markAllInPlay(state);
      return state;
    }

    if (effect instanceof CheckTableStateEffect
      && state.phase === GamePhase.PLAYER_TURN
      && StateUtils.getStadiumCard(state) === this) {
      const player = state.players[state.activePlayer];
      if (player === undefined) {
        return state;
      }
      for (const slot of player.bench) {
        const card = slot.getPokemonCard();
        if (card === undefined || player.marker.hasMarker(RISKY_RUINS_SEEN, card)) {
          continue;
        }
        player.marker.addMarker(RISKY_RUINS_SEEN, card);
        if (card.stage !== Stage.BASIC || slot.pokemons.cards.length !== 1) {
          continue;
        }
        const checkType = new CheckPokemonTypeEffect(slot);
        store.reduceEffect(state, checkType);
        if (!checkType.cardTypes.includes(CardType.DARK)) {
          slot.damage += 20;
        }
      }
    }

    return state;
  }

  private markAllInPlay(state: State): void {
    for (const player of state.players) {
      player.marker.removeMarker(RISKY_RUINS_SEEN);
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card) => {
        player.marker.addMarker(RISKY_RUINS_SEEN, card);
      });
    }
  }
}
