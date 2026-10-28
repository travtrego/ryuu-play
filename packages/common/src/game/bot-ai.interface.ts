import { Action, State } from '../store';

export interface BotAi {
  decodeNextAction(state: State): Action | undefined;

  /**
   * Optional learn-mode hook: a short plain-language reason for the action
   * most recently returned by decodeNextAction(), or undefined if the bot
   * has none (for example when it only answered a prompt).
   */
  explainLastAction?(): string | undefined;
}

export abstract class BotAiFactory {
  constructor(public name: string) { }

  public abstract createBotAi(playerId: number, deck: string[] | null): BotAi;
}
