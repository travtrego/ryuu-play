import { Card } from './card';
import { SuperType, TrainerType } from './card-types';


export abstract class TrainerCard extends Card {

  public superType: SuperType = SuperType.TRAINER;

  public trainerType: TrainerType = TrainerType.ITEM;

  public text: string = '';

  public useWhenInPlay: boolean = false;

  // Optional for structural compatibility with legacy cards that implement
  // TrainerCard instead of extending it. Absence means the normal first-turn
  // Supporter restriction applies; only explicit `true` opts a card in.
  public canUseOnFirstTurn?: boolean = false;

  // A Stadium that turns off Pokémon Tool cards in play (Jamming Tower TWM).
  // While such a Stadium is in play, the store does not pass effects to Tool
  // cards attached to Pokémon. Optional for the same reason as above.
  public toolsInPlayHaveNoEffect?: boolean = false;
}
