import {
  AfterDamageEffect,
  Effect,
  State,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class LuckyHelmet extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'TWM';

  public name: string = 'Lucky Helmet';

  public fullName: string = 'Lucky Helmet TWM';

  public text: string =
    'If the Pokémon this card is attached to is in the Active Spot and is ' +
    'damaged by an attack from your opponent\'s Pokémon (even if this Pokémon ' +
    'is Knocked Out), draw 2 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.trainers.cards.includes(this)) {
      // The holder is the player being attacked; the attacker draws nothing.
      const holder = effect.opponent;

      // Only while in the Active Spot, and only when damage was actually dealt.
      if (effect.target !== holder.active || effect.damage <= 0) {
        return state;
      }

      // "even if this Pokemon is Knocked Out" - the draw happens regardless of
      // whether the holder survived, so this deliberately does not check HP.
      holder.deck.moveTo(holder.hand, 2);
    }

    return state;
  }
}
