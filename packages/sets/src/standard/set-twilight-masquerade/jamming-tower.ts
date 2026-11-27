import { TrainerCard, TrainerType } from '@ptcg/common';

/**
 * Jamming Tower — Twilight Masquerade 153.
 *
 * The effect is in the store: while this Stadium is in play, effects are not
 * passed to Pokémon Tool cards attached to Pokémon (`toolsInPlayHaveNoEffect`).
 * Tools can still be attached, and other cards can still see and discard them.
 */
export class JammingTower extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'TWM';

  public name: string = 'Jamming Tower';

  public fullName: string = 'Jamming Tower TWM';

  public toolsInPlayHaveNoEffect = true;

  public text: string =
    'Pokémon Tool cards in play (both yours and your opponent\'s) have no effect.';
}
