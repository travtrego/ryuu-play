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

export class BlackBeltsTraining extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'JTG';

  public name: string = 'Black Belt\'s Training';

  public fullName: string = 'Black Belt\'s Training JTG';

  public text: string =
    'During this turn, attacks used by your Pokémon do 40 more damage to your opponent\'s Active Pokémon ex ' +
    '(before applying Weakness and Resistance).';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // A played Supporter stays in the Supporter pile until the end of the
    // turn, which is exactly "during this turn".
    if (effect instanceof DealDamageEffect && effect.player.supporter.cards.includes(this)) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      const target = effect.target.getPokemonCard();
      if (effect.target === opponent.active && target !== undefined && target.tags.includes(CardTag.POKEMON_EX)) {
        effect.damage += 40;
      }
    }
    return state;
  }
}
