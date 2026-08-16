import { Action, State } from '@ptcg/common';

export interface CoachActionOption {
  action: Action;
  description: string;
  rationale: string;
}

export interface CoachRecommendation extends CoachActionOption {
  alternatives: CoachActionOption[];
}

// The contract between the deterministic game engine and a reasoning layer
// (rule-based today, potentially an LLM tomorrow). Implementations must only
// ever recommend actions the engine considers legal for the given state -
// the engine, not the advisor, is the authority on what is possible.
export interface CoachAdvisor {
  getRecommendation(state: State, playerId: number): CoachRecommendation | undefined;
}
