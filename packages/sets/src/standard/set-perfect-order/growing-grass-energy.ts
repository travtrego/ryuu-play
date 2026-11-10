import {
  CardType,
  CheckHpEffect,
  CheckPokemonTypeEffect,
  Effect,
  EnergyCard,
  EnergyType,
  State,
  StoreLike,
} from '@ptcg/common';

export class GrowingGrassEnergy extends EnergyCard {
  public provides: CardType[] = [CardType.GRASS];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'POR';

  public name: string = 'Growing Grass Energy';

  public fullName: string = 'Growing Grass Energy POR';

  public text: string =
    'As long as this card is attached to a Pokémon, it provides G Energy. The G Pokémon this card is ' +
    'attached to gets +20 HP.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckHpEffect && effect.target.energies.cards.includes(this)) {
      const checkType = new CheckPokemonTypeEffect(effect.target);
      store.reduceEffect(state, checkType);
      if (checkType.cardTypes.includes(CardType.GRASS)) {
        effect.hp += 20;
      }
    }
    return state;
  }
}
