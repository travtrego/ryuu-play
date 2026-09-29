import {
  Effect,
  GameError,
  GameMessage,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';
import { isTeamRocketsPokemon } from './team-rocket-utils';

export class TeamRocketsAriana extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Ariana';

  public fullName: string = 'Team Rocket\'s Ariana DRI';

  public text: string =
    'Draw cards until you have 5 cards in your hand. If all of your Pokémon in play are ' +
    'Team Rocket\'s Pokémon, draw cards until you have 8 cards in your hand instead.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      const pokemonInPlay = [player.active, ...player.bench]
        .filter(slot => slot.pokemons.cards.length > 0)
        .map(slot => slot.getPokemonCard());
      const allTeamRocket = pokemonInPlay.length > 0
        && pokemonInPlay.every(card => isTeamRocketsPokemon(card));
      const targetHandSize = allTeamRocket ? 8 : 5;
      const handSizeAfterPlayingThis = player.hand.cards.filter(card => card !== this).length;
      const cardsToDraw = Math.max(0, targetHandSize - handSizeAfterPlayingThis);

      if (cardsToDraw === 0 || player.deck.cards.length === 0) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      player.deck.moveTo(player.hand, cardsToDraw);
    }

    return state;
  }
}
