import {
  CardTag,
  CardType,
  CheckProvidedEnergyEffect,
  Effect,
  EnergyCard,
  EnergyType,
  GamePhase,
  KnockOutEffect,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class LegacyEnergy extends EnergyCard {
  public tags = [CardTag.ACE_SPEC];

  public provides: CardType[] = [CardType.COLORLESS];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'TWM';

  public name: string = 'Legacy Energy';

  public fullName: string = 'Legacy Energy TWM';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides every type of Energy but provides only 1 Energy ' +
    'at a time. If the Pokémon this card is attached to is Knocked Out by damage from an attack from your ' +
    'opponent\'s Pokémon, your opponent takes 1 fewer Prize card. This effect of your Legacy Energy can\'t be ' +
    'applied more than once per game.';

  public readonly LEGACY_ENERGY_USED_MARKER = 'LEGACY_ENERGY_USED_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckProvidedEnergyEffect && effect.source.energies.cards.includes(this)) {
      effect.energyMap.forEach(item => {
        if (item.card === this) {
          item.provides = StateUtils.rainbowEnergy();
        }
      });
      return state;
    }

    if (effect instanceof KnockOutEffect && effect.target.energies.cards.includes(this)) {
      const player = effect.player;
      // Knocked Out during the opponent's attack (the engine does not record what
      // caused a Knock Out; same reading as Lillie's Pearl).
      const duringOpponentsAttack = state.phase === GamePhase.ATTACK
        && state.players[state.activePlayer] !== player;
      // Once per game for the player, whichever Legacy Energy it was.
      if (duringOpponentsAttack && !player.marker.hasMarker(this.LEGACY_ENERGY_USED_MARKER)) {
        player.marker.addMarker(this.LEGACY_ENERGY_USED_MARKER, this);
        effect.prizeCount = Math.max(0, effect.prizeCount - 1);
      }
    }

    return state;
  }
}
