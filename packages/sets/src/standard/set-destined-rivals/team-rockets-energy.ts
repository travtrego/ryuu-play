import {
  CardType,
  CheckProvidedEnergyEffect,
  Effect,
  EnergyCard,
  EnergyType,
  EndTurnEffect,
  PlayerType,
  State,
  StoreLike,
} from '@ptcg/common';
import { isTeamRocketsPokemon } from './team-rocket-utils';

export class TeamRocketsEnergy extends EnergyCard {
  // The menu of types this card can pay for; provideAmount decides how many
  // units come from that menu, so this is "2 Energy in any combination of
  // Psychic and Darkness" rather than one of each.
  public provides: CardType[] = [CardType.PSYCHIC, CardType.DARK];

  public provideAmount: number = 2;

  public energyType = EnergyType.SPECIAL;

  public set: string = 'DRI';

  public name = 'Team Rocket\'s Energy';

  public fullName = 'Team Rocket\'s Energy DRI';

  public text =
    'This card can only be attached to a Team Rocket\'s Pokémon. If this card ' +
    'is attached to anything other than a Team Rocket\'s Pokémon, discard this ' +
    'card. As long as this card is attached to a Pokémon, it provides 2 in any ' +
    'combination of Psychic Energy and Darkness Energy.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attached to a Pokemon it does not belong on, it provides nothing. The
    // card is still discarded below, but a mid-turn cost check must not be
    // allowed to spend energy this card is not entitled to provide.
    if (effect instanceof CheckProvidedEnergyEffect
      && effect.source.energies.cards.includes(this)
      && !isTeamRocketsPokemon(effect.source.getPokemonCard())) {
      effect.energyMap = effect.energyMap.filter(item => item.card !== this);
      return state;
    }

    // Discard from anything that is not a Team Rocket's Pokemon. Checked at
    // end of turn rather than on attach, because a Pokemon can stop qualifying
    // after the fact - it can evolve, or be swapped under the attachment.
    if (effect instanceof EndTurnEffect) {
      state.players.forEach(player => {
        // PlayerType only shapes the CardTarget handed to the callback, which
        // this check does not use.
        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (slot, card) => {
          if (slot.energies.cards.includes(this) && !isTeamRocketsPokemon(card)) {
            slot.moveCardTo(this, player.discard);
          }
        });
      });
    }

    return state;
  }
}
