import { Action, PassTurnAction, Player, RetreatAction, State } from '@ptcg/common';
import { LlmCoachAdvisor } from './llm-coach-advisor';
import { CoachingRequest, CoachReasoning } from './coaching-request';

const VIEWER_ID = 101;
const OPPONENT_ID = 202;

class PassTactic {
  useTactic(): Action | undefined {
    return new PassTurnAction(VIEWER_ID);
  }
}

class RetreatTactic {
  useTactic(): Action | undefined {
    return new RetreatAction(VIEWER_ID, 0);
  }
}

class NoTactic {
  useTactic(): Action | undefined {
    return undefined;
  }
}

function reasonerReturning(reasoning: CoachReasoning | undefined) {
  return async () => reasoning;
}

describe('LlmCoachAdvisor', () => {

  let state: State;
  let you: Player;

  beforeEach(() => {
    you = new Player();
    you.id = VIEWER_ID;

    const opponent = new Player();
    opponent.id = OPPONENT_ID;

    state = new State();
    state.players = [ you, opponent ];
  });

  function advisorWith(reasoner: any) {
    return new LlmCoachAdvisor(reasoner, { tactics: [ PassTactic, RetreatTactic ] as any });
  }

  it('returns undefined when the engine offers nothing', async () => {
    const advisor = new LlmCoachAdvisor(reasonerReturning(undefined), {
      tactics: [ NoTactic ] as any
    });

    expect(await advisor.getRecommendation(state, VIEWER_ID)).toBeUndefined();
  });

  it('promotes the reasoner\'s chosen candidate to the recommendation', async () => {
    // c0 is Pass (the heuristic's first pick), c1 is Retreat.
    const advisor = advisorWith(reasonerReturning({
      chosenCandidateId: 'c1',
      rationale: 'Your Active is about to be knocked out.'
    }));

    const recommendation = await advisor.getRecommendation(state, VIEWER_ID);

    expect(recommendation?.action).toEqual(new RetreatAction(VIEWER_ID, 0));
    expect(recommendation?.rationale).toBe('Your Active is about to be knocked out.');
    // The rejected option is kept, not discarded.
    expect(recommendation?.alternatives.length).toBe(1);
    expect(recommendation?.alternatives[0].action).toEqual(new PassTurnAction(VIEWER_ID));
  });

  describe('the reasoner cannot invent a move', () => {

    it('discards a reply naming a candidate the engine never offered', async () => {
      const advisor = advisorWith(reasonerReturning({
        chosenCandidateId: 'c99',
        rationale: 'Attack for 900 damage.'
      }));

      const recommendation = await advisor.getRecommendation(state, VIEWER_ID);

      // Falls back to the deterministic pick, and the invented prose is gone.
      expect(recommendation?.action).toEqual(new PassTurnAction(VIEWER_ID));
      expect(recommendation?.rationale).not.toContain('900');
    });

    it('keeps the engine description even when the reasoner mislabels its choice', async () => {
      const advisor = advisorWith(reasonerReturning({
        chosenCandidateId: 'c0',
        rationale: 'This attacks for 900 and wins the game.'
      }));

      const recommendation = await advisor.getRecommendation(state, VIEWER_ID);

      // Prose is the reasoner's; what the move actually is stays the engine's.
      expect(recommendation?.description).toBe('Pass the turn');
      expect(recommendation?.action).toEqual(new PassTurnAction(VIEWER_ID));
    });

  });

  describe('degrades rather than breaks', () => {

    it('falls back to the deterministic recommendation when the reasoner throws', async () => {
      const advisor = advisorWith(async () => {
        throw new Error('model unavailable');
      });

      const recommendation = await advisor.getRecommendation(state, VIEWER_ID);

      expect(recommendation?.action).toEqual(new PassTurnAction(VIEWER_ID));
    });

    it('falls back when the reasoner returns nothing', async () => {
      const advisor = advisorWith(reasonerReturning(undefined));

      expect((await advisor.getRecommendation(state, VIEWER_ID))?.action)
        .toEqual(new PassTurnAction(VIEWER_ID));
    });

    it('keeps the engine rationale when the reasoner returns empty prose', async () => {
      const advisor = advisorWith(reasonerReturning({
        chosenCandidateId: 'c0',
        rationale: ''
      }));

      const recommendation = await advisor.getRecommendation(state, VIEWER_ID);

      expect(recommendation?.rationale.length).toBeGreaterThan(0);
    });

  });

  describe('the request handed to the reasoner', () => {

    it('carries the viewer\'s snapshot and every legal option', async () => {
      let captured: CoachingRequest | undefined;
      const advisor = advisorWith(async (request: CoachingRequest) => {
        captured = request;
        return undefined;
      });

      await advisor.getRecommendation(state, VIEWER_ID);

      expect(captured?.kind).toBe('turn-action');
      expect(captured?.snapshot.viewerPlayerId).toBe(VIEWER_ID);
      expect(captured?.candidates.map(candidate => candidate.id)).toEqual([ 'c0', 'c1' ]);
      expect(captured?.candidates[0].description).toBe('Pass the turn');
    });

    it('never includes the opponent\'s hand in the payload', async () => {
      const opponent = state.players[1];
      opponent.hand.cards = [ { name: 'Opponent Secret Card' } as any ];

      let captured: CoachingRequest | undefined;
      const advisor = advisorWith(async (request: CoachingRequest) => {
        captured = request;
        return undefined;
      });

      await advisor.getRecommendation(state, VIEWER_ID);

      expect(JSON.stringify(captured)).not.toContain('Opponent Secret Card');
    });

  });

});
