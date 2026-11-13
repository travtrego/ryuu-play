import {
  AbstractAttackEffect,
  AfterDamageEffect,
  ApplyWeaknessEffect,
  CardType,
  CheckPokemonTypeEffect,
  DealDamageEffect,
  Effect,
  EnergyCard,
  EnergyType,
  PutDamageEffect,
  State,
  StateUtils,
  StoreLike,
} from '@ptcg/common';

export class RockyFightingEnergy extends EnergyCard {
  public provides: CardType[] = [CardType.FIGHTING];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'POR';

  public name: string = 'Rocky Fighting Energy';

  public fullName: string = 'Rocky Fighting Energy POR';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides F Energy. Prevent all effects of attacks used ' +
    'by your opponent\'s Pokémon done to the F Pokémon this card is attached to. (Existing effects are not ' +
    'removed. Damage is not an effect.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // The Mist Energy shape, only for a F Pokémon.
    if (effect instanceof AbstractAttackEffect
      && effect.target.energies.cards.includes(this)
      && !(effect instanceof DealDamageEffect)
      && !(effect instanceof PutDamageEffect)
      && !(effect instanceof ApplyWeaknessEffect)
      && !(effect instanceof AfterDamageEffect)
      && StateUtils.findOwner(state, effect.target) !== effect.player) {
      const checkType = new CheckPokemonTypeEffect(effect.target);
      store.reduceEffect(state, checkType);
      if (checkType.cardTypes.includes(CardType.FIGHTING)) {
        effect.preventDefault = true;
      }
    }
    return state;
  }
}
