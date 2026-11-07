import {
  CardType,
  CheckRetreatCostEffect,
  Effect,
  State,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class AirBalloon extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'ASC';

  public name: string = 'Air Balloon';

  public fullName: string = 'Air Balloon ASC';

  public text: string =
    'The Retreat Cost of the Pokémon this card is attached to is C C less.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckRetreatCostEffect && effect.player.active.trainers.cards.includes(this)) {
      // Remove up to 2 Energy from the cost, Colorless first.
      for (let i = 0; i < 2 && effect.cost.length > 0; i++) {
        const index = effect.cost.indexOf(CardType.COLORLESS);
        effect.cost.splice(index !== -1 ? index : effect.cost.length - 1, 1);
      }
    }
    return state;
  }
}
