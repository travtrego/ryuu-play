import {
  CardType,
  CheckPokemonTypeEffect,
  DealDamageEffect,
  Effect,
  EndTurnEffect,
  State,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class PremiumPowerPro extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'MEG';

  public name: string = 'Premium Power Pro';

  public fullName: string = 'Premium Power Pro MEG';

  public text: string =
    'During this turn, attacks used by your F Pokémon do 30 more damage to your opponent\'s Active Pokémon ' +
    '(before applying Weakness and Resistance).';

  private readonly PREMIUM_POWER_PRO_MARKER = 'PREMIUM_POWER_PRO_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // A played Item is in the discard pile, which still receives effects; the
    // marker (one per card, so several copies add up) lasts until the turn ends.
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      effect.player.marker.addMarker(this.PREMIUM_POWER_PRO_MARKER, this);
      return state;
    }

    if (effect instanceof DealDamageEffect
      && effect.player.marker.hasMarker(this.PREMIUM_POWER_PRO_MARKER, this)
      && effect.target === effect.opponent.active
      && effect.damage > 0) {
      const checkType = new CheckPokemonTypeEffect(effect.source);
      store.reduceEffect(state, checkType);
      if (checkType.cardTypes.includes(CardType.FIGHTING)) {
        effect.damage += 30;
      }
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.PREMIUM_POWER_PRO_MARKER, this);
    }

    return state;
  }
}
