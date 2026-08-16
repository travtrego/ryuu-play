import { Action, PassTurnAction, Player, State } from '@ptcg/common';
import { HeuristicCoachAdvisor } from './heuristic-coach-advisor';

// Fake tactics that satisfy the shape the advisor relies on (`useTactic`),
// without needing to construct a fully legal in-engine board state. This
// keeps the test focused on the advisor's own logic: picking the
// highest-priority legal candidate and collecting the rest as alternatives.
class NeverActsTactic {
  useTactic(): Action | undefined {
    return undefined;
  }
}

class ThrowingTactic {
  useTactic(): Action | undefined {
    throw new Error('boom');
  }
}

class AlwaysPassTactic {
  useTactic(): Action | undefined {
    return new PassTurnAction(1);
  }
}

describe('HeuristicCoachAdvisor', () => {

  let state: State;
  let you: Player;

  beforeEach(() => {
    you = new Player();
    you.id = 1;

    state = new State();
    state.players = [ you ];
  });

  it('returns undefined for a player that is not part of the game', () => {
    const advisor = new HeuristicCoachAdvisor();

    expect(advisor.getRecommendation(state, 99)).toBeUndefined();
  });

  it('returns undefined when no tactic has a legal action to suggest', () => {
    const advisor = new HeuristicCoachAdvisor({ tactics: [ NeverActsTactic, ThrowingTactic ] as any });

    expect(advisor.getRecommendation(state, you.id)).toBeUndefined();
  });

  it('recommends the first tactic with a legal action, in priority order, and lists the rest as alternatives', () => {
    const advisor = new HeuristicCoachAdvisor({
      tactics: [ NeverActsTactic, ThrowingTactic, AlwaysPassTactic, AlwaysPassTactic ] as any
    });

    const recommendation = advisor.getRecommendation(state, you.id);

    expect(recommendation).toBeDefined();
    expect(recommendation?.action).toEqual(new PassTurnAction(1));
    expect(recommendation?.description).toBe('Pass the turn');
    expect(recommendation?.alternatives.length).toBe(1);
  });

  it('skips a tactic that throws instead of failing the whole recommendation', () => {
    const advisor = new HeuristicCoachAdvisor({ tactics: [ ThrowingTactic, AlwaysPassTactic ] as any });

    const recommendation = advisor.getRecommendation(state, you.id);

    expect(recommendation?.action).toEqual(new PassTurnAction(1));
  });

});
