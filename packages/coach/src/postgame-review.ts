import { State } from '@ptcg/common';
import { SimpleBotOptions } from '@ptcg/simple-bot';
import { CandidateDeltas, evaluateCandidate, UNKNOWN_DELTAS } from './candidate-deltas';
import { CoachDecisionKind } from './coach-advisor.interface';
import { GameStateSequence } from './game-state-sequence';
import { GameStateSnapshot, buildGameStateSnapshot } from './game-state-snapshot';
import { HeuristicCoachAdvisor } from './heuristic-coach-advisor';
import { detectGroundedFindings, ReviewFinding } from './review-finding';

export interface ReviewedDecision {
  // Index into the sequence, so a UI can jump to the moment.
  position: number;
  turn: number;
  kind: CoachDecisionKind;
  // What the player could legally see at the time. Rebuilt from that state
  // alone, so a review never shows information the player did not have.
  snapshot: GameStateSnapshot;
  question: string | null;
  // What the coach would have recommended, engine-derived.
  recommended: string;
  recommendedDeltas: CandidateDeltas;
  findings: ReviewFinding[];
}

export interface PostgameReview {
  playerId: number;
  decisionCount: number;
  decisions: ReviewedDecision[];
  findings: ReviewFinding[];
}

export interface PostgameReviewOptions extends Partial<SimpleBotOptions> {
  // Cap on decisions examined, so reviewing a long game cannot run away.
  maxDecisions?: number;
}

const DEFAULT_MAX_DECISIONS = 200;

function isDecisionPointFor(state: State, playerId: number): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (player === undefined) {
    return false;
  }

  // A prompt addressed to the player is a decision regardless of whose turn
  // the engine considers it to be.
  const hasPrompt = state.prompts.some(
    prompt => prompt.playerId === playerId && prompt.result === undefined
  );
  if (hasPrompt) {
    return true;
  }

  // Otherwise it is only their decision while they hold the turn.
  const activePlayer = state.players[state.activePlayer];
  return activePlayer !== undefined && activePlayer.id === playerId;
}

// Walks a finished game and reports, for each point where the player had a
// decision, what was recommendable at the time and what measurably better line
// existed.
//
// Every judgement is made from the state as it stood, so the review cannot
// leak information that was hidden when the decision was made - reviewing with
// hindsight the player never had would teach the wrong lesson.
export function reviewGame(
  sequence: GameStateSequence,
  playerId: number,
  options: PostgameReviewOptions = {}
): PostgameReview {
  const advisor = new HeuristicCoachAdvisor(options);
  const arbiter = options.arbiter ?? {};
  const maxDecisions = options.maxDecisions ?? DEFAULT_MAX_DECISIONS;

  const decisions: ReviewedDecision[] = [];

  for (let position = 0; position < sequence.getStateCount(); position++) {
    if (decisions.length >= maxDecisions) {
      break;
    }

    let state: State;
    try {
      state = sequence.getState(position);
    } catch (error) {
      continue;
    }

    if (!isDecisionPointFor(state, playerId)) {
      continue;
    }

    const recommendation = advisor.getRecommendation(state, playerId);
    if (recommendation === undefined) {
      continue;
    }

    let snapshot: GameStateSnapshot;
    try {
      snapshot = buildGameStateSnapshot(state, playerId);
    } catch (error) {
      continue;
    }

    const recommendedDeltas = evaluateCandidate(
      state, playerId, recommendation.action, arbiter
    );

    const alternatives = recommendation.alternatives.map(alternative => ({
      description: alternative.description,
      deltas: evaluateCandidate(state, playerId, alternative.action, arbiter)
    }));

    // The line the coach would have taken is the baseline; anything the
    // alternatives beat measurably becomes a finding.
    const findings = detectGroundedFindings(
      recommendedDeltas ?? UNKNOWN_DELTAS,
      alternatives
    );

    decisions.push({
      position,
      turn: state.turn,
      kind: recommendation.kind,
      snapshot,
      question: recommendation.question,
      recommended: recommendation.description,
      recommendedDeltas,
      findings
    });
  }

  return {
    playerId,
    decisionCount: decisions.length,
    decisions,
    findings: decisions.reduce(
      (all, decision) => all.concat(decision.findings),
      [] as ReviewFinding[]
    )
  };
}
