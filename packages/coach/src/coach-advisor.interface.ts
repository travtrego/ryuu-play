import { Action, State } from '@ptcg/common';

// A player faces two different kinds of decision. Most of the game is spent
// choosing a turn action, but a large share of real skill expression happens
// while answering a prompt the engine raised - what to search for, what to
// discard, which Pokemon to bench. A coach has to cover both.
export type CoachDecisionKind = 'turn-action' | 'prompt-response';

export interface CoachActionOption {
  action: Action;
  description: string;
  rationale: string;
}

export interface CoachRecommendation extends CoachActionOption {
  kind: CoachDecisionKind;
  // The question being answered, when the decision is a prompt response.
  // Null for ordinary turn actions.
  question: string | null;
  alternatives: CoachActionOption[];
}

// The contract between the deterministic game engine and a reasoning layer
// (rule-based today, potentially an LLM tomorrow). Implementations must only
// ever recommend actions the engine considers legal for the given state -
// the engine, not the advisor, is the authority on what is possible.
export interface CoachAdvisor {
  getRecommendation(state: State, playerId: number): CoachRecommendation | undefined;
}
