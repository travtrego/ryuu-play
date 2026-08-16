import { BotArbiterOptions, State } from '@ptcg/common';
import { CandidateDeltas, evaluateCandidate } from './candidate-deltas';
import { CoachDecisionKind, CoachRecommendation } from './coach-advisor.interface';
import { buildGameStateSnapshot, GameStateSnapshot } from './game-state-snapshot';

export interface CoachingCandidate {
  // Stable within one request. A reasoning layer answers with this id, which
  // is the whole reason it cannot invent a move: there is no field in its
  // reply that carries an action.
  id: string;
  description: string;
  deltas: CandidateDeltas;
}

export interface CoachingRequest {
  kind: CoachDecisionKind;
  // The prompt being answered, when the decision is a prompt response.
  question: string | null;
  snapshot: GameStateSnapshot;
  candidates: CoachingCandidate[];
}

// What a reasoning layer is allowed to return: a choice among candidates, and
// prose. Note there is no action field - by construction it can only pick from
// what the engine already produced.
export interface CoachReasoning {
  chosenCandidateId: string;
  rationale: string;
}

export type CoachReasoner = (request: CoachingRequest) => Promise<CoachReasoning | undefined>;

export function candidateId(index: number): string {
  return `c${index}`;
}

// Packages everything a reasoning layer needs into one plain, serializable
// object: the board from the player's point of view, the question if there is
// one, and every legal option with its simulated consequences.
export function buildCoachingRequest(
  state: State,
  playerId: number,
  recommendation: CoachRecommendation,
  arbiter: Partial<BotArbiterOptions> = {}
): CoachingRequest {
  const options = [ recommendation, ...recommendation.alternatives ];

  return {
    kind: recommendation.kind,
    question: recommendation.question,
    snapshot: buildGameStateSnapshot(state, playerId),
    candidates: options.map((option, index) => ({
      id: candidateId(index),
      description: option.description,
      deltas: evaluateCandidate(state, playerId, option.action, arbiter)
    }))
  };
}
