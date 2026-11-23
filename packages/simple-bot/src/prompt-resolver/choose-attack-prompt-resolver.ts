import { Player, State, Action, ResolvePromptAction, Prompt, Attack, GamePhase, Power } from '@ptcg/common';
import { PromptResolver } from './prompt-resolver';
import { ChooseAttackPrompt } from '@ptcg/common';
import { locksOwnAttackNextTurn, printedDamageKnocksOut } from '../simple-tactics/attack-utils';


export class ChooseAttackPromptResolver extends PromptResolver {

  public resolvePrompt(state: State, player: Player, prompt: Prompt<any>): Action | undefined {
    if (prompt instanceof ChooseAttackPrompt) {
      let result: Attack | Power | null = null;

      if (prompt.options.enableAttack) {
        result = this.buildAttackToChoose(state, player, prompt);
      }

      // Attacks not available, so let's choose an ability (if possible)
      if (result === null) {
        result = this.buildAbilityToChoose(state, prompt);
      }

      // const result: Attack | null = this.buildAttackToChoose(state, prompt);
      return new ResolvePromptAction(prompt.id, result);
    }
  }

  private buildAttackToChoose(state: State, player: Player, prompt: ChooseAttackPrompt): Attack | null {
    const attacks: Attack[] = [];

    // Foul Play is banned, because when Zoroark meet's another Zoroak
    // they would copy theirs attacks in the infinite loop.
    const banned: string[] = state.phase === GamePhase.ATTACK
      ? ['Foul Play', 'Metronome'] : [];

    prompt.cards.forEach((card, index) => {
      card.attacks.forEach(attack => {
        const isBlocked = prompt.options.blocked.some(b => {
          return b.index === index && b.name === attack.name;
        });
        if (!isBlocked && !banned.includes(attack.name)) {
          attacks.push(attack);
        }
      });
    });

    attacks.sort((a, b) => {
      const damage1 = parseInt(a.damage, 10) || 0;
      const damage2 = parseInt(b.damage, 10) || 0;
      if (damage1 !== damage2) {
        return damage2 - damage1;
      }
      return b.cost.length - a.cost.length;
    });

    if (attacks.length === 0) {
      return null;
    }

    // Copying an attack (Night Joker, Foul Play and the like): when an attack
    // that leaves this Pokémon free to attack next turn already Knocks Out
    // the opponent's Active Pokémon, don't take a bigger one that locks it.
    if (this.options.scores.tactics.avoidAttackLock !== false
      && state.phase === GamePhase.ATTACK && locksOwnAttackNextTurn(attacks[0])) {
      const opponent = state.players.find(p => p.id !== player.id);
      const attacker = player.active.getPokemonCard();
      const free = opponent && attacks.find(a => !locksOwnAttackNextTurn(a)
        && printedDamageKnocksOut(a, attacker, opponent.active));
      if (free !== undefined) {
        return free;
      }
    }

    return attacks[0];
  }

  private buildAbilityToChoose(state: State, prompt: ChooseAttackPrompt): Power | null {
    const powers: Power[] = [];

    prompt.cards.forEach((card, index) => {
      const cardPowers: Power[] = [];

      if (prompt.options.enableAbility.useWhenInPlay) {
        cardPowers.push(...card.powers.filter(p => p.useWhenInPlay));
      }
      if (prompt.options.enableAbility.useFromHand) {
        cardPowers.push(...card.powers.filter(p => p.useFromHand));
      }
      if (prompt.options.enableAbility.useFromDiscard) {
        cardPowers.push(...card.powers.filter(p => p.useFromDiscard));
      }

      cardPowers.forEach(power => {
        const isBlocked = prompt.options.blocked.some(b => {
          return b.index === index && b.name === power.name;
        });
        if (!isBlocked) {
          powers.push(power);
        }
      });
    });

    // Prefer powers with longer text ;)
    powers.sort((a, b) => b.text.length - a.text.length);

    return powers.length > 0 ? powers[0] : null;
  }

}
