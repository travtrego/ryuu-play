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
  public trainerType: TrainerType = TrainerType.TOOL;

  public tags = [CardTag.ACE_SPEC];

  public set: string = 'TEF';

  public name: string = 'Maximum Belt';

  public fullName: string = 'Maximum Belt TEF';

  public text: string =
    'The attacks of the Pokémon this card is attached to do 50 more damage to ' +
    'your opponent\'s Active Pokémon ex (before applying Weakness and ' +
    'Resistance).';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof DealDamageEffect && effect.source.trainers.cards.includes(this)) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      const defending = opponent.active.getPokemonCard();

      // Only against an Active Pokemon ex, and only when the attack is already
      // doing damage - a 0-damage attack is not turned into a 50-damage one.
      if (effect.damage > 0
        && effect.target === opponent.active
        && defending !== undefined
        && defending.tags.includes(CardTag.POKEMON_EX)) {
        effect.damage += 50;
      }
    }

    return state;
  }
}
