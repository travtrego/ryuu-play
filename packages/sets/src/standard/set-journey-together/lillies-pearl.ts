import {
  Effect,
  GamePhase,
  KnockOutEffect,
  State,
  StoreLike,
  TrainerCard,
  TrainerType,
} from '@ptcg/common';

export class LilliesPearl extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'JTG';

  public name: string = 'Lillie\'s Pearl';

  public fullName: string = 'Lillie\'s Pearl JTG';

  public text: string =
    'If the Lillie\'s Pokémon this card is attached to is Knocked Out by damage from an attack from your ' +
    'opponent\'s Pokémon, that player takes 1 fewer Prize card.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof KnockOutEffect && effect.target.trainers.cards.includes(this)) {
      const card = effect.target.getPokemonCard();
      // Knocked Out during the opponent's attack (the engine does not record what
      // caused a Knock Out, so damage and damage counters from that attack count alike).
      const duringOpponentsAttack = state.phase === GamePhase.ATTACK
        && state.players[state.activePlayer] !== effect.player;
      if (card !== undefined && card.name.startsWith('Lillie\'s ') && duringOpponentsAttack) {
        effect.prizeCount = Math.max(0, effect.prizeCount - 1);
      }
    }
    return state;
  }
}
