import {
  AfterDamageEffect,
  Effect,
  GamePhase,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class LuckyHelmet extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'TWM';

  public name: string = 'Lucky Helmet';

  public fullName: string = 'Lucky Helmet TWM';

  public text: string =
    'If the Pokémon this card is attached to is in the Active Spot and is damaged by an attack ' +
    'from your opponent\'s Pokémon (even if this Pokémon is Knocked Out), draw 2 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.trainers.cards.includes(this)) {
      const attacker = effect.player;
      const owner = StateUtils.findOwner(state, effect.target);
      if (effect.damage <= 0 || attacker === owner || owner.active !== effect.target) {
        return state;
      }
      if (state.phase === GamePhase.ATTACK) {
        owner.deck.moveTo(owner.hand, 2);
      }
    }
    return state;
  }
}
