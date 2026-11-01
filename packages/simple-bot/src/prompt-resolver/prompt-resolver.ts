import { Player, State, Action, Prompt } from '@ptcg/common';
import { SimpleBotOptions } from '../simple-bot-options';
import { StateScore } from '../state-score/state-score';

export type PromptResolverList = (new (options: SimpleBotOptions) => PromptResolver)[];

export abstract class PromptResolver {

  protected stateScore: StateScore;

  constructor(protected options: SimpleBotOptions) {
    this.stateScore = new StateScore(this.options);
  }

  public abstract resolvePrompt(state: State, player: Player, prompt: Prompt<any>): Action | undefined;

  /**
   * Learn mode: a short plain-language reason for the answer this resolver
   * just returned for the prompt, computed from the same state. Returns ''
   * when the resolver has nothing useful (or nothing public) to say.
   * Must not change the state or the answer.
   */
  public explain(state: State, player: Player, prompt: Prompt<any>, action: Action): string {
    return '';
  }

  protected getStateScore(state: State, playerId: number): number {
    return this.stateScore.getScore(state, playerId);
  }

}
