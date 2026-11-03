import { Player, State, Action, ResolvePromptAction, Prompt, StateUtils, CardType, GameMessage } from '@ptcg/common';
import { PromptResolver } from './prompt-resolver';
import { ChooseEnergyPrompt, EnergyMap } from '@ptcg/common';
import { countedNames, describeCost } from '../explain/explain-utils';


export class ChooseEnergyPromptResolver extends PromptResolver {

  public resolvePrompt(state: State, player: Player, prompt: Prompt<any>): Action | undefined {
    if (prompt instanceof ChooseEnergyPrompt) {
      let result: EnergyMap[] = [];
      // const provides = prompt.energy.slice();
      const costs: CardType[] = prompt.cost.filter(c => c !== CardType.COLORLESS);

      const provides: EnergyMap[] = [];
      // Expand each EnergyMap into individual energy units according to provideAmount
      prompt.energy.forEach(e => {
        for (let i = 0; i < e.provideAmount; i++) {
          provides.push(e);
        }
      });

      // First use energies that are providing less energy types
      provides.sort((a, b) => a.provides.length - b.provides.length);

      while (costs.length > 0 && provides.length > 0) {
        const cost = costs[0];
        const index = provides.findIndex(p => p.provides.includes(cost));

        if (index === -1) {
          break; // impossible to pay for the cost
        }

        const provide = provides[index];
        provides.splice(index, 1);
        if (!result.some(r => r.card === provide.card)) {
          result.push(provide);
        }

        costs.shift();
      }

      if (costs.length > 0) {
        // Impossible to pay for the cost, try to cancel
        return new ResolvePromptAction(prompt.id, null);
      }

      const remainingEnergies = prompt.energy.filter(p => !result.includes(p));

      // Only colorless energies are remaining to pay
      // Sort rest of the provided energies by the score
      // (Number of provided energy, provided type)
      remainingEnergies.sort((p1, p2) => {
        const score1 = this.getEnergyCardScore(p1.provides, p1.provideAmount);
        const score2 = this.getEnergyCardScore(p2.provides, p2.provideAmount);
        return score1 - score2;
      });

      // Add energies until all colorless cost is paid
      while (remainingEnergies.length > 0 && !StateUtils.checkEnoughEnergy(result, prompt.cost)) {
        const provide = remainingEnergies.shift();
        if (provide !== undefined) {
          result.push(provide);
        }
      }

      // Make sure we have used only the required energies to pay
      let needCheck = true;
      while (needCheck) {
        needCheck = false;
        for (let i = 0; i < result.length; i++) {
          const tempCards = result.slice();
          tempCards.splice(i, 1);
          const enough = StateUtils.checkEnoughEnergy(tempCards, prompt.cost);
          if (enough) {
            result = tempCards;
            needCheck = true;
            break;
          }
        }
      }

      return new ResolvePromptAction(prompt.id, result);
    }
  }

  /**
   * Learn mode. Attached Energy is public, so the choice can always be named.
   * The reason restates the order resolvePrompt() really uses: typed costs
   * first, each with the Energy that can provide the fewest types; then the
   * Colorless part with the Energy that provides the least
   * (getEnergyCardScore); then any Energy that is not needed is dropped.
   */
  public explain(state: State, player: Player, prompt: Prompt<any>, action: Action): string {
    if (!(prompt instanceof ChooseEnergyPrompt) || !(action instanceof ResolvePromptAction)) {
      return '';
    }
    const retreat = prompt.message === GameMessage.CHOOSE_POKEMON_TO_SWITCH;
    const discard = retreat || prompt.message === GameMessage.CHOOSE_ENERGIES_TO_DISCARD;
    const cost = describeCost(prompt.cost);
    const what = retreat
      ? `to pay the Retreat Cost (${cost})`
      : `for the effect, which asks for ${cost} Energy`;
    const chosen: EnergyMap[] | null = action.result;

    if (chosen === null) {
      return retreat
        ? `Did not retreat: its Energy cannot pay the Retreat Cost (${cost}).`
        : `Chose no Energy: its Energy cannot cover the ${cost} Energy the effect asks for.`;
    }
    if (chosen.length === 0) {
      return '';
    }

    const verb = discard ? 'Discarded' : 'Chose';
    const names = countedNames(chosen.map(e => e.card.name));
    const head = `${verb} ${names} ${what}.`;

    const kept = prompt.energy.filter(e => !chosen.includes(e));
    if (kept.length === 0) {
      return `${head} That was all the Energy it could choose from.`;
    }
    const keptNames = countedNames(kept.map(e => e.card.name));
    const chosenNames = chosen.map(e => e.card.name);
    if (kept.every(e => chosenNames.includes(e.card.name))) {
      // Only more of the same cards were left, so there was no real choice.
      return `${head} It kept ${keptNames}.`;
    }

    const typed = prompt.cost.some(c => c !== CardType.COLORLESS);
    const colorless = prompt.cost.some(c => c === CardType.COLORLESS);
    const rules: string[] = [];
    if (typed) {
      rules.push('pays each typed Energy with the Energy that can provide the fewest types');
    }
    if (colorless) {
      rules.push(`pays ${typed ? 'the' : 'a'} Colorless cost with the Energy that provides the least`);
    }
    rules.push('uses no more Energy than needed');
    const rule = rules.length === 3
      ? `${rules[0]}, ${rules[1]} and ${rules[2]}`
      : rules.join(' and ');

    return `${head} It kept ${keptNames}: the bot ${rule}.`;
  }

  private getEnergyCardScore(provides: CardType[], provideAmount: number): number {
    let score = 0;
    provides.forEach(c => {
      if (c === CardType.COLORLESS) {
        score += 2;
      } else {
        score += 3;
      }
    });
    return provideAmount * score;
  }

}
