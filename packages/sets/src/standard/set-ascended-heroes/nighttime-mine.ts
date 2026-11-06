import {
  CardTag,
  CardType,
  CheckAttackCostEffect,
  Effect,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class NighttimeMine extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'ASC';

  public name: string = 'Nighttime Mine';

  public fullName: string = 'Nighttime Mine ASC';

  public text: string = 'Attacks used by each Tera Pokémon in play (both yours and your opponent\'s) cost C more.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckAttackCostEffect && StateUtils.getStadiumCard(state) === this) {
      const card = effect.player.active.getPokemonCard();
      if (card !== undefined && card.tags.includes(CardTag.TERA)) {
        effect.cost.push(CardType.COLORLESS);
      }
    }
    return state;
  }
}
