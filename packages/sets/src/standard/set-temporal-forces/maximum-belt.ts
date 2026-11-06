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

export class MaximumBelt extends TrainerCard {
  public tags = [CardTag.ACE_SPEC];

  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'TEF';

  public name: string = 'Maximum Belt';

  public fullName: string = 'Maximum Belt TEF';

  public text: string =
    'Attacks used by the Pokémon this card is attached to do 50 more damage to your ' +
    'opponent\'s Active Pokémon ex (before applying Weakness and Resistance).';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof DealDamageEffect && effect.source.trainers.cards.includes(this)) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      if (effect.target !== opponent.active) {
        return state;
      }
      const targetCard = effect.target.getPokemonCard();
      if (targetCard !== undefined && targetCard.tags.includes(CardTag.POKEMON_EX)) {
        effect.damage += 50;
      }
    }
    return state;
  }
}
