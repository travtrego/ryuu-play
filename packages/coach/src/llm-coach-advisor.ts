import { State } from '@ptcg/common';
import { SimpleBotOptions } from '@ptcg/simple-bot';
import { CoachActionOption, CoachRecommendation } from './coach-advisor.interface';
import { buildCoachingRequest, candidateId, CoachReasoner, CoachReasoning } from './coaching-request';
import { HeuristicCoachAdvisor } from './heuristic-coach-advisor';

// Reasoning layers call out to something slow and remote, so unlike
// CoachAdvisor this cannot be synchronous. Kept as a separate interface rather
// than making every advisor async, so the deterministic ones stay simple.
export interface AsyncCoachAdvisor {
  getRecommendation(state: State, playerId: number): Promise<CoachRecommendation | undefined>;
}

export interface LlmCoachAdvisorOptions extends Partial<SimpleBotOptions> {
  // Deltas require simulating each candidate, which is the expensive part of
  // building a request. Off by default for callers that only want ranking.
  includeDeltas?: boolean;
}

// Puts a reasoning layer behind the same seam the heuristic advisor uses.
//
// The safety property is structural rather than a matter of trust. The engine
// produces the candidate list; the reasoner may only answer with the id of a
// candidate plus prose. Its reply carries no action, so there is no path by
// which it can invent a move, target the wrong Pokemon, or make an illegal
// play - the worst it can do is choose badly among legal options, or return
// something unusable, in which case the deterministic recommendation stands.
//
// The reasoner's prose is used only as `rationale`, which is display text.
// `action` and `description` always come from the engine, so even a reasoner
// that describes its choice inaccurately cannot misreport what the move does.
export class LlmCoachAdvisor implements AsyncCoachAdvisor {

  private heuristic: HeuristicCoachAdvisor;
  private includeDeltas: boolean;
  private options: LlmCoachAdvisorOptions;

  constructor(private reasoner: CoachReasoner, options: LlmCoachAdvisorOptions = {}) {
    this.heuristic = new HeuristicCoachAdvisor(options);
    this.includeDeltas = options.includeDeltas === true;
    this.options = options;
  }

  public async getRecommendation(
    state: State,
    playerId: number
  ): Promise<CoachRecommendation | undefined> {
    // The engine decides what is on the table. Everything below only reorders
    // and re-explains this list.
    const baseline = this.heuristic.getRecommendation(state, playerId);
    if (baseline === undefined) {
      return undefined;
    }

    const request = buildCoachingRequest(
      state,
      playerId,
      baseline,
      this.includeDeltas ? (this.options.arbiter ?? {}) : {}
    );

    let reasoning: CoachReasoning | undefined;
    try {
      reasoning = await this.reasoner(request);
    } catch (error) {
      // A reasoning layer that fails is a degraded coach, not a broken one.
      return baseline;
    }

    if (reasoning === undefined) {
      return baseline;
    }

    const options = [ baseline as CoachActionOption, ...baseline.alternatives ];
    const chosenIndex = options.findIndex(
      (option, index) => candidateId(index) === reasoning?.chosenCandidateId
    );

    // An id that matches no candidate means the reasoner answered with
    // something the engine never offered. Discard the whole reply.
    if (chosenIndex === -1) {
      return baseline;
    }

    const chosen = options[chosenIndex];
    const alternatives = options.filter((option, index) => index !== chosenIndex);

    return {
      // Engine-derived, never taken from the reasoner.
      action: chosen.action,
      description: chosen.description,
      // The one field the reasoner controls.
      rationale: typeof reasoning.rationale === 'string' && reasoning.rationale.length > 0
        ? reasoning.rationale
        : chosen.rationale,
      kind: baseline.kind,
      question: baseline.question,
      alternatives
    };
  }

}
