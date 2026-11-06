import {
  AttachEnergyEffect,
  CardType,
  CheckTableStateEffect,
  Effect,
  EnergyCard,
  EnergyType,
  GameError,
  GameMessage,
  PlayerType,
  State,
  StoreLike,
} from '@ptcg/common';
import { isTeamRocketsPokemon } from './team-rocket-utils';

export class TeamRocketsEnergy extends EnergyCard {
  // Each of the 2 Energy it provides is either P or D.
  public provides: CardType[] = [CardType.PSYCHIC, CardType.DARK];

  public provideAmount = 2;

  public energyType = EnergyType.SPECIAL;

  public set: string = 'DRI';

  public name: string = 'Team Rocket\'s Energy';

  public fullName: string = 'Team Rocket\'s Energy DRI';

  public text: string =
    'This card can only be attached to a Team Rocket\'s Pokémon. If this card is attached to ' +
    'anything other than a Team Rocket\'s Pokémon, discard this card. ' +
    'As long as this card is attached to a Pokémon, it provides 2 in any combination of ' +
    'P Energy and D Energy.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttachEnergyEffect && effect.energyCard === this) {
      if (!isTeamRocketsPokemon(effect.target.getPokemonCard())) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      return state;
    }

    if (effect instanceof CheckTableStateEffect) {
      state.players.forEach(player => {
        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, pokemonSlot => {
          if (pokemonSlot.energies.cards.includes(this)
            && !isTeamRocketsPokemon(pokemonSlot.getPokemonCard())) {
            pokemonSlot.moveCardTo(this, player.discard);
          }
        });
      });
    }

    return state;
  }
}
