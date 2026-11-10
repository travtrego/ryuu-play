import {
  DealDamageEffect,
  Effect,
  EndTurnEffect,
  GameError,
  GameMessage,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

const GLADIONS_FINAL_BATTLE_MARKER = 'GLADIONS_FINAL_BATTLE_MARKER';

export class GladionsFinalBattle extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'PBL';

  public name: string = 'Gladion\'s Final Battle';

  public fullName: string = 'Gladion\'s Final Battle PBL';

  public text: string =
    'You can use this card only when it is the last card in your hand. During this turn, attacks used by your ' +
    'Pokémon that don\'t have a Rule Box do 80 more damage to your opponent\'s Active Pokémon (before applying ' +
    'Weakness and Resistance). (Pokémon ex, Pokémon V, etc. have Rule Boxes.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const player = effect.player;
      if (player.hand.cards.some(c => c !== this)) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      player.marker.addMarker(GLADIONS_FINAL_BATTLE_MARKER, this);
      return state;
    }

    if (effect instanceof DealDamageEffect && effect.player.marker.hasMarker(GLADIONS_FINAL_BATTLE_MARKER, this)) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      const attacker = effect.source.getPokemonCard();
      if (effect.target === opponent.active && attacker !== undefined && !StateUtils.hasRuleBox(attacker)) {
        effect.damage += 80;
      }
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(GLADIONS_FINAL_BATTLE_MARKER, this);
    }

    return state;
  }
}
