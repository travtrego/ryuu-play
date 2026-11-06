import { Action, Player, State, SpecialCondition, AttackAction } from '@ptcg/common';
import { SimpleTactic } from './simple-tactics';
import { describeChanges, joinList } from '../explain/explain-utils';

export class AttackTactic extends SimpleTactic {

  public useTactic(state: State, player: Player): Action | undefined {
    const sp = player.active.specialConditions;
    if (sp.includes(SpecialCondition.PARALYZED) || sp.includes(SpecialCondition.ASLEEP)) {
      return undefined;
    }

    const active = player.active.getPokemonCard();
    if (!active) {
      return undefined;
    }

    const attackBonus = this.options.scores.tactics.attackBonus;
    let bestScore = this.getStateScore(state, player.id) - attackBonus;
    let attackAction: AttackAction | undefined;

    active.attacks.forEach(attack => {
      const action = new AttackAction(player.id, attack.name);
      const score = this.evaluateAction(state, player.id, action);

      if (score !== undefined && bestScore < score) {
        bestScore = score;
        attackAction = action;
      }
    });

    return attackAction;
  }

  public explain(state: State, player: Player, action: Action): string {
    if (!(action instanceof AttackAction)) {
      return super.explain(state, player, action);
    }
    const what = this.describeAction(state, player, action);
    const after = this.simulateAction(state, action);
    const facts = after !== undefined ? describeChanges(state, after, player.id) : [];
    const result = facts.length > 0 ? `: it ${joinList(facts)}` : '';
    const others = (player.active.getPokemonCard()?.attacks.length || 0) > 1
      ? ' It was the best-scoring attack, and attacking beat ending the turn without one.'
      : ' Attacking scored better than ending the turn without attacking.';
    const attack = player.active.getPokemonCard()?.attacks.find(a => a.name === action.name);
    const flips = attack !== undefined && /flip/i.test(attack.text)
      ? ' (The bot plans as if its coin flips land heads.)'
      : '';
    return `${what}${result}.${others}${flips}`;
  }

}
