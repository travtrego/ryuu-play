import {
  CardTag,
  DealDamageEffect,
  Effect,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class BraveBangle extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'WHT';

  public name: string = 'Brave Bangle';

  public fullName: string = 'Brave Bangle WHT';

  public text: string =
    'If the Pokémon this card is attached to doesn\'t have a Rule Box, the attacks it uses do 30 more damage ' +
    'to your opponent\'s Active Pokémon ex (before applying Weakness and Resistance). (Pokémon ex, Pokémon V, ' +
    'etc. have Rule Boxes.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof DealDamageEffect && effect.source.trainers.cards.includes(this)) {
      const attacker = effect.source.getPokemonCard();
      if (attacker === undefined || StateUtils.hasRuleBox(attacker)) {
        return state;
      }
      const opponent = StateUtils.getOpponent(state, effect.player);
      const target = effect.target.getPokemonCard();
      if (effect.target === opponent.active && target !== undefined && target.tags.includes(CardTag.POKEMON_EX)) {
        effect.damage += 30;
      }
    }
    return state;
  }
}
