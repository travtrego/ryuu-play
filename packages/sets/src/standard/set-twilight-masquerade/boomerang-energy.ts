import {
  CardType,
  DiscardCardsEffect,
  Effect,
  EndTurnEffect,
  EnergyCard,
  EnergyType,
  PlayerType,
  State,
  StoreLike,
} from '@ptcg/common';

export class BoomerangEnergy extends EnergyCard {
  public provides: CardType[] = [CardType.COLORLESS];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'TWM';

  public name: string = 'Boomerang Energy';

  public fullName: string = 'Boomerang Energy TWM';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides C Energy. If this card is discarded by an ' +
    'effect of an attack used by the Pokémon this card is attached to, attach this card from your discard ' +
    'pile to that Pokémon after attacking.';

  public readonly BOOMERANG_MARKER = 'BOOMERANG_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Discarded by an effect of an attack used by the Pokémon it is attached to.
    if (effect instanceof DiscardCardsEffect && effect.cards.includes(this)
      && effect.target === effect.player.active
      && effect.target.energies.cards.includes(this)) {
      effect.target.marker.addMarker(this.BOOMERANG_MARKER, this);
      return state;
    }

    // "After attacking": the attack ends the turn, so this runs on that EndTurnEffect.
    if (effect instanceof EndTurnEffect) {
      const player = effect.player;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, slot => {
        if (!slot.marker.hasMarker(this.BOOMERANG_MARKER, this)) {
          return;
        }
        slot.marker.removeMarker(this.BOOMERANG_MARKER, this);
        if (player.discard.cards.includes(this)) {
          player.discard.moveCardTo(this, slot.energies);
        }
      });
    }

    return state;
  }
}
