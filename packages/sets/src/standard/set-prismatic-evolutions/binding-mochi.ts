import {
  DealDamageEffect,
  Effect,
  SpecialCondition,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class BindingMochi extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'PRE';

  public name: string = 'Binding Mochi';

  public fullName: string = 'Binding Mochi PRE';

  public text: string =
    'If the Pokémon this card is attached to is Poisoned, its attacks do 40 more damage to your opponent\'s ' +
    'Active Pokémon (before applying Weakness and Resistance).';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof DealDamageEffect
      && effect.source.trainers.cards.includes(this)
      && effect.source.specialConditions.includes(SpecialCondition.POISONED)) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      if (effect.target === opponent.active) {
        effect.damage += 40;
      }
    }
    return state;
  }
}
