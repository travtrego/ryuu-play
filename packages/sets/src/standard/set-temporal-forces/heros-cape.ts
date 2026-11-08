import {
  CardTag,
  CheckHpEffect,
  Effect,
  State,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class HerosCape extends TrainerCard {
  public tags = [CardTag.ACE_SPEC];

  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'TEF';

  public name: string = 'Hero\'s Cape';

  public fullName: string = 'Hero\'s Cape TEF';

  public text: string = 'The Pokémon this card is attached to gets +100 HP.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckHpEffect && effect.target.trainers.cards.includes(this)) {
      effect.hp += 100;
    }
    return state;
  }
}
