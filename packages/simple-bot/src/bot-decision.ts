import { Action } from '@ptcg/common';

/**
 * What the bot decided on its last turn action and why, in plain language.
 * Produced for learn mode so a human can see the reasoning behind each move.
 */
export interface BotDecision {
  /** The action the bot returned. */
  action: Action;
  /** Name of the tactic that chose it, e.g. "AttachEnergyTactic", or "PassTurn". */
  tactic: string;
  /** One or two short sentences explaining the move. */
  reason: string;
}
