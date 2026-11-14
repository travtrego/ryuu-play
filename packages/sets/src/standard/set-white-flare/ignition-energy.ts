import {
  CardType,
  CheckProvidedEnergyEffect,
  Effect,
  EndTurnEffect,
  EnergyCard,
  EnergyType,
  PlayerType,
  Stage,
  State,
  StoreLike,
} from '@ptcg/common';

export class IgnitionEnergy extends EnergyCard {
  public provides: CardType[] = [CardType.COLORLESS];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'WHT';

  public name: string = 'Ignition Energy';

  public fullName: string = 'Ignition Energy WHT';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides C Energy. If this card is attached to an ' +
    'Evolution Pokémon, it provides CCC Energy instead. If this card is attached to 1 of your Pokémon, ' +
    'discard it at the end of the turn.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckProvidedEnergyEffect && effect.source.energies.cards.includes(this)) {
      const pokemon = effect.source.getPokemonCard();
      if (pokemon !== undefined && pokemon.stage !== Stage.BASIC) {
        effect.energyMap.forEach(item => {
          if (item.card === this) {
            item.provides = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];
          }
        });
      }
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      for (const player of state.players) {
        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, slot => {
          if (slot.energies.cards.includes(this)) {
            slot.moveCardTo(this, player.discard);
          }
        });
      }
    }

    return state;
  }
}
