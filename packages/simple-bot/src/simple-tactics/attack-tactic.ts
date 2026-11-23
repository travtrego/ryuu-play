import { Action, Attack, Player, State, SpecialCondition, AttackAction } from '@ptcg/common';
import { locksOwnAttackNextTurn } from './attack-utils';
import { SimpleTactic } from './simple-tactics';
import { describeChanges, joinList } from '../explain/explain-utils';

export class AttackTactic extends SimpleTactic {

  public useTactic(state: State, player: Player): Action | undefined {
    return this.chooseAttack(state, player).action;
  }

  /**
   * The best-scoring attack, if any beats ending the turn. One exception:
   * when the best attack stops this Pokémon attacking next turn ("During
   * your next turn, this Pokémon can't attack"), an attack without that
   * drawback which takes as many Prize cards is preferred. `instead` names
   * the locking attack that was passed over.
   */
  private chooseAttack(state: State, player: Player): { action?: AttackAction, instead?: string } {
    const sp = player.active.specialConditions;
    if (sp.includes(SpecialCondition.PARALYZED) || sp.includes(SpecialCondition.ASLEEP)) {
      return {};
    }

    const active = player.active.getPokemonCard();
    if (!active) {
      return {};
    }

    const attackBonus = this.options.scores.tactics.attackBonus;
    const passScore = this.getStateScore(state, player.id) - attackBonus;
    let bestScore = passScore;
    let best: { attack: Attack, action: AttackAction, prizes: number } | undefined;
    const scored: { attack: Attack, action: AttackAction, score: number, prizes: number }[] = [];

    active.attacks.forEach(attack => {
      const action = new AttackAction(player.id, attack.name);
      const after = this.simulateAction(state, action);
      const me = after && after.players.find(p => p.id === player.id);
      if (after === undefined || me === undefined) {
        return;
      }
      const score = this.getStateScore(after, player.id);
      const prizes = player.getPrizeLeft() - me.getPrizeLeft();
      scored.push({ attack, action, score, prizes });

      if (bestScore < score) {
        bestScore = score;
        best = { attack, action, prizes };
      }
    });

    if (best === undefined) {
      return {};
    }

    if (this.options.scores.tactics.avoidAttackLock !== false
      && best.prizes > 0 && locksOwnAttackNextTurn(best.attack)) {
      const chosen = best;
      const free = scored
        .filter(s => !locksOwnAttackNextTurn(s.attack) && s.score > passScore && s.prizes >= chosen.prizes)
        .sort((a, b) => b.score - a.score)[0];
      if (free !== undefined) {
        return { action: free.action, instead: chosen.attack.name };
      }
    }

    return { action: best.action };
  }

  public explain(state: State, player: Player, action: Action): string {
    if (!(action instanceof AttackAction)) {
      return super.explain(state, player, action);
    }
    const what = this.describeAction(state, player, action);
    const after = this.simulateAction(state, action);
    const facts = after !== undefined ? describeChanges(state, after, player.id) : [];
    const result = facts.length > 0 ? `: it ${joinList(facts)}` : '';
    const instead = this.chooseAttack(state, player).instead;
    const others = instead !== undefined
      ? ` It takes as many Prize cards as ${instead}, which would stop this Pokémon attacking next turn.`
      : (player.active.getPokemonCard()?.attacks.length || 0) > 1
        ? ' It was the best-scoring attack, and attacking beat ending the turn without one.'
        : ' Attacking scored better than ending the turn without attacking.';
    const attack = player.active.getPokemonCard()?.attacks.find(a => a.name === action.name);
    const flips = attack !== undefined && /flip/i.test(attack.text)
      ? ' (The bot plans as if its coin flips land heads.)'
      : '';
    return `${what}${result}.${others}${flips}`;
  }

}
