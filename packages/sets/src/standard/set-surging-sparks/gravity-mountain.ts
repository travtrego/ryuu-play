import {
  CheckHpEffect,
  Effect,
  Stage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class GravityMountain extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'SSP';

  public name: string = 'Gravity Mountain';

  public fullName: string = 'Gravity Mountain SSP';

  public text: string = 'Each Stage 2 Pokémon in play (both yours and your opponent\'s) gets -30 HP.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckHpEffect && StateUtils.getStadiumCard(state) === this) {
      const card = effect.target.getPokemonCard();
      if (card !== undefined && card.stage === Stage.STAGE_2) {
        effect.hp -= 30;
      }
    }
    return state;
  }
}
