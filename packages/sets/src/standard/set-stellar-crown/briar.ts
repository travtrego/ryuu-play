import {
  CardTag,
  Effect,
  GameError,
  GameMessage,
  GamePhase,
  KnockOutEffect,
  State,
  StateUtils,
  StoreLike,
  TrainerCard,
  TrainerEffect,
  TrainerType,
} from '@ptcg/common';

export class Briar extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public set: string = 'SCR';

  public name: string = 'Briar';

  public fullName: string = 'Briar SCR';

  public text: string =
    'You can use this card only if your opponent has exactly 2 Prize cards remaining. During this turn, if ' +
    'your opponent\'s Active Pokémon is Knocked Out by damage from an attack used by your Tera Pokémon, take 1 ' +
    'more Prize card.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const opponent = StateUtils.getOpponent(state, effect.player);
      if (opponent.getPrizeLeft() !== 2) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      return state;
    }

    // A played Supporter stays in the Supporter pile until the end of the
    // turn, which is exactly "during this turn". The engine does not record
    // what caused a Knock Out: a Knock Out of the opponent's Active Pokémon
    // during this player's attack, by an attacking Tera Pokémon, counts (the
    // same reading as Legacy Energy and Lillie's Pearl).
    if (effect instanceof KnockOutEffect) {
      const owner = StateUtils.getOpponent(state, effect.player);
      if (!owner.supporter.cards.includes(this)) {
        return state;
      }
      if (state.phase !== GamePhase.ATTACK || state.players[state.activePlayer] !== owner) {
        return state;
      }
      if (effect.target !== effect.player.active) {
        return state;
      }
      const attacker = owner.active.getPokemonCard();
      if (attacker === undefined || !attacker.tags.includes(CardTag.TERA)) {
        return state;
      }
      effect.prizeCount += 1;
    }

    return state;
  }
}
