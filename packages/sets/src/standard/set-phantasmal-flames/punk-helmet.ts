import {
  AfterDamageEffect,
  CardType,
  Effect,
  GamePhase,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class PunkHelmet extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'PFL';

  public name: string = 'Punk Helmet';

  public fullName: string = 'Punk Helmet PFL';

  public text: string =
    'If the D Pokémon this card is attached to is in the Active Spot and is damaged by an attack from your ' +
    'opponent\'s Pokémon (even if it is Knocked Out), put 4 damage counters on the Attacking Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.trainers.cards.includes(this)) {
      const attacker = effect.player;
      const owner = StateUtils.findOwner(state, effect.target);
      const card = effect.target.getPokemonCard();
      if (effect.damage <= 0 || attacker === owner || owner.active !== effect.target
        || card === undefined || !card.cardTypes.includes(CardType.DARK)) {
        return state;
      }
      if (state.phase === GamePhase.ATTACK) {
        effect.source.damage += 40;
      }
    }
    return state;
  }
}
