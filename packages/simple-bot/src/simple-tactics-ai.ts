import { Player, State, PassTurnAction, Action, GamePhase, Prompt,
  InvitePlayerPrompt, StateLog, ResolvePromptAction, GameLog, BotAi,
  SpecialCondition } from '@ptcg/common';
import { PromptResolver } from './prompt-resolver/prompt-resolver';
import { SimpleTactic } from './simple-tactics/simple-tactics';
import { SimpleBotOptions } from './simple-bot-options';
import { Simulator } from '@ptcg/common';
import { BotDecision } from './bot-decision';
import { payableAttacks, pokemonName } from './explain/explain-utils';

export class SimpleTacticsAi implements BotAi {

  private tactics: SimpleTactic[];
  private resolvers: PromptResolver[];
  private lastDecision: BotDecision | undefined;

  constructor(
    private playerId: number,
    options: SimpleBotOptions,
    private deck: string[] | null
  ) {
    this.tactics = options.tactics.map(tactic => new tactic(options));
    this.resolvers = options.promptResolvers.map(resolver => new resolver(options));
  }

  /**
   * Reason for the most recent turn action returned by decodeNextAction().
   * Undefined when that call returned nothing or answered a prompt.
   */
  public getLastDecision(): BotDecision | undefined {
    return this.lastDecision;
  }

  public explainLastAction(): string | undefined {
    return this.lastDecision ? this.lastDecision.reason : undefined;
  }

  public decodeNextAction(state: State): Action | undefined {
    this.lastDecision = undefined;
    let player: Player | undefined;
    for (let i = 0; i < state.players.length; i++) {
      if (state.players[i].id === this.playerId) {
        player = state.players[i];
      }
    }

    if (player === undefined) {
      return;
    }

    if (state.prompts.length > 0) {
      const playerId = player.id;
      const prompt = state.prompts.find(p => p.playerId === playerId && p.result === undefined);
      if (prompt !== undefined) {
        return this.resolvePrompt(player, state, prompt);
      }
    }

    // Wait for other players to resolve the prompts.
    if (state.prompts.filter(p => p.result === undefined).length > 0) {
      return;
    }

    const activePlayer = state.players[state.activePlayer];
    const isMyTurn = activePlayer.id === this.playerId;
    if (state.phase === GamePhase.PLAYER_TURN && isMyTurn) {
      return this.decodePlayerTurnAction(player, state);
    }
  }

  private decodePlayerTurnAction(player: Player, state: State): Action {
    for (let i = 0; i < this.tactics.length; i++) {
      const tactic = this.tactics[i];
      const action = tactic.useTactic(state, player);
      if (action !== undefined && this.isValidAction(state, action)) {
        this.lastDecision = {
          action,
          tactic: tactic.constructor.name,
          reason: this.safeExplain(() => tactic.explain(state, player, action))
        };
        return action;
      }
    }

    const pass = new PassTurnAction(this.playerId);
    this.lastDecision = {
      action: pass,
      tactic: 'PassTurn',
      reason: this.safeExplain(() => this.explainPass(state, player))
    };
    return pass;
  }

  private explainPass(state: State, player: Player): string {
    const active = player.active;
    const card = active.getPokemonCard();
    if (card === undefined) {
      return 'Ended the turn: there was nothing useful left to do.';
    }
    const sc = active.specialConditions;
    if (sc.includes(SpecialCondition.PARALYZED)) {
      return `Ended the turn without attacking: ${card.name} is Paralyzed and cannot attack this turn.`;
    }
    if (sc.includes(SpecialCondition.ASLEEP)) {
      return `Ended the turn without attacking: ${card.name} is Asleep and cannot attack this turn.`;
    }
    if (card.attacks.length === 0) {
      return `Ended the turn: ${card.name} has no attacks, and nothing else would improve the position.`;
    }
    if (payableAttacks(active).length === 0) {
      return `Ended the turn without attacking: ${pokemonName(active)} does not have enough Energy for any attack yet.`;
    }
    return `Ended the turn without attacking: in the bot's simulation none of ${card.name}'s attacks `
      + 'left it in a better position than simply passing.';
  }

  /** Explanations must never stop the bot from playing. */
  private safeExplain(explain: () => string): string {
    try {
      return explain();
    } catch (error) {
      return '';
    }
  }

  private resolvePrompt(player: Player, state: State, prompt: Prompt<any>): Action {
    if (prompt instanceof InvitePlayerPrompt) {
      const result = this.deck;
      let log: StateLog | undefined;
      if (result === null) {
        log = new StateLog(GameLog.LOG_TEXT, {
          text: 'Sorry, my deck is not ready.'
        }, player.id);
      }
      return new ResolvePromptAction(prompt.id, result, log);
    }

    for (let i = 0; i < this.resolvers.length; i++) {
      const action = this.resolvers[i].resolvePrompt(state, player, prompt);
      if (action !== undefined) {
        return action;
      }
    }

    // Unknown prompt type. Try to cancel it.
    return new ResolvePromptAction(prompt.id, null);
  }

  private isValidAction(state: State, action: Action): boolean {
    try {
      const simulator = new Simulator(state);
      simulator.dispatch(action);
    } catch (error) {
      return false;
    }
    return true;
  }

}
