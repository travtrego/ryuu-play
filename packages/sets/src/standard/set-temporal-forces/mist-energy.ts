import {
  AbstractAttackEffect,
  AfterDamageEffect,
  ApplyWeaknessEffect,
  CardType,
  DealDamageEffect,
  Effect,
  EnergyCard,
  EnergyType,
  PutDamageEffect,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class MistEnergy extends EnergyCard {
  public provides: CardType[] = [CardType.COLORLESS];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'TEF';

  public name: string = 'Mist Energy';

  public fullName: string = 'Mist Energy TEF';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides C Energy. Prevent all effects of attacks used ' +
    'by your opponent\'s Pokémon done to the Pokémon this card is attached to. (Existing effects are not ' +
    'removed. Damage is not an effect.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AbstractAttackEffect
      && effect.target.energies.cards.includes(this)
      && !(effect instanceof DealDamageEffect)
      && !(effect instanceof PutDamageEffect)
      && !(effect instanceof ApplyWeaknessEffect)
      && !(effect instanceof AfterDamageEffect)
      && StateUtils.findOwner(state, effect.target) !== effect.player) {
      effect.preventDefault = true;
    }
    return state;
  }
}
