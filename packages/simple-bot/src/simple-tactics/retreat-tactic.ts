import { Action, Player, State, RetreatAction } from '@ptcg/common';
import { SimpleTactic } from './simple-tactics';
import { CONDITION_NAMES, joinList, payableAttacks, pokemonName } from '../explain/explain-utils';

export class RetreatTactic extends SimpleTactic {

  public useTactic(state: State, player: Player): Action | undefined {

    if (player.retreatedTurn === state.turn) {
      return;
    }

    let bestScore = this.getStateScore(state, player.id);
    let retreatAction: RetreatAction | undefined;
    player.bench.forEach((bench, index) => {
      if (bench.pokemons.cards.length === 0) {
        return;
      }

      const action = new RetreatAction(player.id, index);
      const score = this.evaluateAction(state, player.id, action);

      if (score !== undefined && bestScore < score) {
        bestScore = score;
        retreatAction = action;
      }
    });

    if (retreatAction === undefined) {
      retreatAction = this.freeRetreatToAttacker(state, player);
    }

    return retreatAction;
  }

  /**
   * The state score values HP and printed damage, so it can keep a big
   * Pokémon that can't attack in the Active Spot while a Benched Pokémon
   * could (e.g. an attack that copies another attack has no printed damage).
   * When the retreat costs nothing (no Energy leaves play), switch to a
   * Pokémon that can attack. Added 2026-11-09 for the Slowking deck, whose
   * mirror games otherwise stalled with neither Active able to attack.
   */
  private freeRetreatToAttacker(state: State, player: Player): RetreatAction | undefined {
    if (payableAttacks(player.active).length > 0) {
      return undefined;
    }
    const energyInPlay = (p: Player) => {
      let count = p.active.energies.cards.length;
      p.bench.forEach(b => { count += b.energies.cards.length; });
      return count;
    };
    const before = energyInPlay(player);

    let best: RetreatAction | undefined;
    let bestScore: number | undefined;
    player.bench.forEach((bench, index) => {
      if (bench.pokemons.cards.length === 0 || payableAttacks(bench).length === 0) {
        return;
      }
      const action = new RetreatAction(player.id, index);
      const newState = this.simulateAction(state, action);
      const newPlayer = newState && newState.players.find(p => p.id === player.id);
      if (newState === undefined || newPlayer === undefined || energyInPlay(newPlayer) !== before
        || payableAttacks(newPlayer.active).length === 0) {
        return;
      }
      const score = this.getStateScore(newState, player.id);
      if (bestScore === undefined || score > bestScore) {
        bestScore = score;
        best = action;
      }
    });
    return best;
  }

  public explain(state: State, player: Player, action: Action): string {
    if (!(action instanceof RetreatAction)) {
      return super.explain(state, player, action);
    }
    const oldActive = player.active;
    const newActive = player.bench[action.benchIndex];
    const reasons: string[] = [];

    const conditions = oldActive.specialConditions
      .filter(c => CONDITION_NAMES[c] !== undefined)
      .map(c => CONDITION_NAMES[c]);
    if (conditions.length > 0) {
      reasons.push(`${pokemonName(oldActive)} is ${joinList(conditions)}, and retreating clears that`);
    }
    if (newActive !== undefined) {
      const oldAttacks = payableAttacks(oldActive);
      const newAttacks = payableAttacks(newActive);
      if (oldAttacks.length === 0 && newAttacks.length > 0) {
        reasons.push(`${pokemonName(newActive)} has the Energy to use ${newAttacks[newAttacks.length - 1].name}`
          + `, and ${pokemonName(oldActive)} cannot attack yet`);
      }
      const oldCard = oldActive.getPokemonCard();
      if (oldActive.damage > 0 && oldCard !== undefined && oldCard.hp - oldActive.damage <= oldCard.hp / 2) {
        reasons.push(`${pokemonName(oldActive)} is badly damaged (${oldActive.damage} damage) and safer on the Bench`);
      }
    }
    const why = reasons.length > 0
      ? reasons.join('; ')
      : `${pokemonName(newActive)} scored better as the Active Pokémon in the bot's simulation`;
    const cost = player.active.getPokemonCard()?.retreat.length || 0;
    const costNote = cost > 0
      ? ` Retreating discards ${cost} Energy, so the bot only does it when the swap is worth it.`
      : '';
    return `${this.describeAction(state, player, action)}: ${why}.${costNote}`;
  }

}
