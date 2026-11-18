import {
  CheckHpEffect,
  Effect,
  State,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';
import { isCynthiasPokemon } from './cynthia-utils';

export class CynthiasPowerWeight extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'DRI';

  public name: string = 'Cynthia\'s Power Weight';

  public fullName: string = 'Cynthia\'s Power Weight DRI';

  public text: string = 'The Cynthia\'s Pokémon this card is attached to gets +70 HP.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckHpEffect
      && effect.target.trainers.cards.includes(this)
      && isCynthiasPokemon(effect.target.getPokemonCard())) {
      effect.hp += 70;
    }
    return state;
  }
}
