import {
  CardTag,
  CardType,
  CheckProvidedEnergyEffect,
  Effect,
  EnergyCard,
  EnergyType,
  Stage,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

/** Neo Upper Energy — Temporal Forces 162 (ACE SPEC). */
export class NeoUpperEnergy extends EnergyCard {
  public tags = [CardTag.ACE_SPEC];

  public provides: CardType[] = [CardType.COLORLESS];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'TEF';

  public name: string = 'Neo Upper Energy';

  public fullName: string = 'Neo Upper Energy TEF';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides C Energy. If this card is attached to a Stage 2 ' +
    'Pokémon, this card provides every type of Energy but provides only 2 Energy at a time.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckProvidedEnergyEffect && effect.source.energies.cards.includes(this)) {
      const pokemon = effect.source.getPokemonCard();
      if (pokemon !== undefined && pokemon.stage === Stage.STAGE_2) {
        effect.energyMap.forEach(item => {
          if (item.card === this) {
            item.provides = StateUtils.rainbowEnergy();
            item.provideAmount = 2;
          }
        });
      }
    }
    return state;
  }
}
