import { Action, ConfirmPrompt, GameMessage, PassTurnAction, Player, PokemonCard,
  ResolvePromptAction, RetreatAction, State } from '@ptcg/common';
import { StateListSequence } from './game-state-sequence';
import { reviewGame } from './postgame-review';
import { detectGroundedFindings, isGroundedFinding, ReviewFindingKind } from './review-finding';
import { UNKNOWN_DELTAS } from './candidate-deltas';

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

function testPokemon(name: string): PokemonCard {
  class TestPokemon extends PokemonCard {
    name = name;
    fullName = name;
    set = 'TST';
    hp = 100;
  }
  return new TestPokemon();
}

function buildState(activeIndex: number, turn: number): State {
  const you = new Player();
  you.id = VIEWER_ID;
  you.name = 'You';

  const opponent = new Player();
  opponent.id = OPPONENT_ID;
  opponent.name = 'Opponent';

  const state = new State();
  state.players = [ you, opponent ];
  state.activePlayer = activeIndex;
  state.turn = turn;
  return state;
}

describe('reviewGame', () => {

  it('reviews nothing when the player never had a decision', () => {
    // Every state is the opponent's turn.
    const sequence = new StateListSequence([ buildState(1, 1), buildState(1, 2) ]);

    const review = reviewGame(sequence, VIEWER_ID, { tactics: [ PassTactic ] as any });

    expect(review.decisionCount).toBe(0);
    expect(review.findings).toEqual([]);
  });

  it('reports a decision for each state where the player held the turn', () => {
    const sequence = new StateListSequence([
      buildState(0, 1),
      buildState(1, 2),
      buildState(0, 3)
    ]);

    const review = reviewGame(sequence, VIEWER_ID, { tactics: [ PassTactic ] as any });

    expect(review.decisionCount).toBe(2);
    expect(review.decisions.map(decision => decision.turn)).toEqual([ 1, 3 ]);
    expect(review.decisions.map(decision => decision.position)).toEqual([ 0, 2 ]);
  });

  it('treats a prompt addressed to the player as their decision even on the opponent\'s turn', () => {
    const state = buildState(1, 4);
    const prompt = new ConfirmPrompt(VIEWER_ID, GameMessage.WANT_TO_USE_ABILITY);
    state.prompts = [ prompt ];

    const sequence = new StateListSequence([ state ]);

    const review = reviewGame(sequence, VIEWER_ID, {
      tactics: [ NoTactic ] as any,
      promptResolvers: [ class {
        resolvePrompt(s: State, p: Player, pr: any): Action {
          return new ResolvePromptAction(pr.id, true);
        }
      } ] as any
    });

    expect(review.decisionCount).toBe(1);
    expect(review.decisions[0].kind).toBe('prompt-response');
    expect(review.decisions[0].question).toBe('Want to use ability');
  });

  it('ignores a prompt addressed to the opponent', () => {
    const state = buildState(1, 4);
    state.prompts = [ new ConfirmPrompt(OPPONENT_ID, GameMessage.WANT_TO_USE_ABILITY) ];

    const review = reviewGame(new StateListSequence([ state ]), VIEWER_ID, {
      tactics: [ PassTactic ] as any
    });

    expect(review.decisionCount).toBe(0);
  });

  it('never includes information hidden from the reviewed player', () => {
    const state = buildState(0, 1);
    state.players[1].hand.cards = [ testPokemon('Opponent Secret Card') ];
    state.players[1].deck.cards = [ testPokemon('Opponent Secret Deck Card') ];

    const review = reviewGame(new StateListSequence([ state ]), VIEWER_ID, {
      tactics: [ PassTactic ] as any
    });

    const serialized = JSON.stringify(review);
    expect(serialized).not.toContain('Opponent Secret Card');
    expect(serialized).not.toContain('Opponent Secret Deck Card');
  });

  it('honours maxDecisions so a long game cannot run away', () => {
    const states = [];
    for (let i = 0; i < 20; i++) {
      states.push(buildState(0, i + 1));
    }

    const review = reviewGame(new StateListSequence(states), VIEWER_ID, {
      tactics: [ PassTactic ] as any,
      maxDecisions: 3
    });

    expect(review.decisionCount).toBe(3);
  });

  it('records the alternatives the coach considered at each decision', () => {
    const review = reviewGame(new StateListSequence([ buildState(0, 1) ]), VIEWER_ID, {
      tactics: [ PassTactic, RetreatTactic ] as any
    });

    expect(review.decisions[0].recommended).toBe('Pass the turn');
  });

  it('survives a sequence that throws when read', () => {
    const broken = {
      getStateCount: () => 2,
      getState: (position: number) => {
        if (position === 0) {
          throw new Error('corrupt state');
        }
        return buildState(0, 2);
      }
    };

    const review = reviewGame(broken, VIEWER_ID, { tactics: [ PassTactic ] as any });

    expect(review.decisionCount).toBe(1);
  });

});

describe('detectGroundedFindings', () => {

  const noOutcome = { ...UNKNOWN_DELTAS };

  it('reports a missed knockout when an alternative had one available', () => {
    const findings = detectGroundedFindings(
      { ...noOutcome, knocksOutOpponentActive: false },
      [ { description: 'Attack with Psystrike', deltas: { ...noOutcome, knocksOutOpponentActive: true } } ]
    );

    expect(findings.length).toBe(1);
    expect(findings[0].kind).toBe(ReviewFindingKind.MISSED_KO);
    expect(findings[0].betterLine).toBe('Attack with Psystrike');
    expect(findings[0].grounded).toBeTrue();
  });

  it('does not report a missed knockout when the line taken already knocked out', () => {
    const findings = detectGroundedFindings(
      { ...noOutcome, knocksOutOpponentActive: true },
      [ { description: 'Other', deltas: { ...noOutcome, knocksOutOpponentActive: true } } ]
    );

    expect(findings).toEqual([]);
  });

  it('reports a missed prize when an alternative took more', () => {
    const findings = detectGroundedFindings(
      { ...noOutcome, prizesTaken: 1 },
      [ { description: 'Boss\'s Orders line', deltas: { ...noOutcome, prizesTaken: 2 } } ]
    );

    expect(findings[0].kind).toBe(ReviewFindingKind.MISSED_PRIZE);
  });

  it('ignores damage differences too small to call a mistake', () => {
    const findings = detectGroundedFindings(
      { ...noOutcome, damageToOpponentActive: 100 },
      [ { description: 'Marginally better', deltas: { ...noOutcome, damageToOpponentActive: 120 } } ]
    );

    expect(findings).toEqual([]);
  });

  it('reports materially more damage', () => {
    const findings = detectGroundedFindings(
      { ...noOutcome, damageToOpponentActive: 50 },
      [ { description: 'Much better', deltas: { ...noOutcome, damageToOpponentActive: 150 } } ]
    );

    expect(findings[0].kind).toBe(ReviewFindingKind.MISSED_DAMAGE);
  });

  it('claims nothing when outcomes could not be computed', () => {
    // Null means unknown, and must never be read as zero.
    const findings = detectGroundedFindings(noOutcome, [
      { description: 'Unknown line', deltas: noOutcome }
    ]);

    expect(findings).toEqual([]);
  });

  it('classifies judgement findings as not grounded', () => {
    expect(isGroundedFinding(ReviewFindingKind.MISSED_KO)).toBeTrue();
    expect(isGroundedFinding(ReviewFindingKind.RESOURCE_OVERCOMMITMENT)).toBeFalse();
    expect(isGroundedFinding(ReviewFindingKind.GOOD_SEQUENCING)).toBeFalse();
    expect(isGroundedFinding(ReviewFindingKind.BETTER_SEARCH_TARGET)).toBeFalse();
  });

});
