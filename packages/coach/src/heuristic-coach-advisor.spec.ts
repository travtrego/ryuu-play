import { Action, CardList, ChooseCardsPrompt, ConfirmPrompt, GameMessage, PassTurnAction,
  Player, PokemonCard, ResolvePromptAction, SelectPrompt, State, SuperType } from '@ptcg/common';
import { HeuristicCoachAdvisor } from './heuristic-coach-advisor';

const VIEWER_ID = 101;

function testPokemon(name: string): PokemonCard {
  class TestPokemon extends PokemonCard {
    name = name;
    fullName = name;
    set = 'TST';
    hp = 100;
  }
  return new TestPokemon();
}

// Fake tactics satisfying the shape the advisor relies on (`useTactic`),
// without needing a fully legal in-engine board. Keeps these tests focused on
// the advisor's own logic rather than on engine setup.
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
    return new PassTurnAction(VIEWER_ID);
  }
}

// Resolvers are constructed with options and asked to resolve a prompt, so a
// stub only needs that one method.
function resolverReturning(result: any) {
  return class StubResolver {
    resolvePrompt(state: State, player: Player, prompt: any): Action {
      return new ResolvePromptAction(prompt.id, result);
    }
  };
}

class ThrowingResolver {
  resolvePrompt(): Action {
    throw new Error('resolver exploded');
  }
}

describe('HeuristicCoachAdvisor', () => {

  let state: State;
  let you: Player;

  beforeEach(() => {
    you = new Player();
    you.id = VIEWER_ID;

    state = new State();
    state.players = [ you ];
  });

  describe('turn actions', () => {

    it('returns undefined for a player that is not part of the game', () => {
      const advisor = new HeuristicCoachAdvisor();

      expect(advisor.getRecommendation(state, 999)).toBeUndefined();
    });

    it('returns undefined when no tactic has a legal action to suggest', () => {
      const advisor = new HeuristicCoachAdvisor({ tactics: [ NeverActsTactic, ThrowingTactic ] as any });

      expect(advisor.getRecommendation(state, VIEWER_ID)).toBeUndefined();
    });

    it('recommends the first tactic with a legal action and lists the rest as alternatives', () => {
      const advisor = new HeuristicCoachAdvisor({
        tactics: [ NeverActsTactic, ThrowingTactic, AlwaysPassTactic, AlwaysPassTactic ] as any
      });

      const recommendation = advisor.getRecommendation(state, VIEWER_ID);

      expect(recommendation?.kind).toBe('turn-action');
      expect(recommendation?.question).toBeNull();
      expect(recommendation?.action).toEqual(new PassTurnAction(VIEWER_ID));
      expect(recommendation?.description).toBe('Pass the turn');
      expect(recommendation?.alternatives.length).toBe(1);
    });

    it('skips a tactic that throws instead of failing the whole recommendation', () => {
      const advisor = new HeuristicCoachAdvisor({ tactics: [ ThrowingTactic, AlwaysPassTactic ] as any });

      expect(advisor.getRecommendation(state, VIEWER_ID)?.action)
        .toEqual(new PassTurnAction(VIEWER_ID));
    });

  });

  describe('prompt responses', () => {

    let prompt: ConfirmPrompt;

    beforeEach(() => {
      prompt = new ConfirmPrompt(VIEWER_ID, GameMessage.WANT_TO_USE_ABILITY);
      prompt.id = 7;
      state.prompts = [ prompt ];
    });

    it('answers the pending prompt instead of suggesting a turn action', () => {
      const advisor = new HeuristicCoachAdvisor({
        tactics: [ AlwaysPassTactic ] as any,
        promptResolvers: [ resolverReturning(true) ] as any
      });

      const recommendation = advisor.getRecommendation(state, VIEWER_ID);

      expect(recommendation?.kind).toBe('prompt-response');
      expect(recommendation?.description).toBe('Yes');
      expect(recommendation?.question).toBe('Want to use ability');
      expect(recommendation?.action instanceof ResolvePromptAction).toBeTrue();
    });

    it('ignores a prompt that is already resolved', () => {
      prompt.result = true;

      const advisor = new HeuristicCoachAdvisor({
        tactics: [ AlwaysPassTactic ] as any,
        promptResolvers: [ resolverReturning(true) ] as any
      });

      expect(advisor.getRecommendation(state, VIEWER_ID)?.kind).toBe('turn-action');
    });

    it('ignores a prompt addressed to another player', () => {
      const opponentPrompt = new ConfirmPrompt(999, GameMessage.WANT_TO_USE_ABILITY);
      state.prompts = [ opponentPrompt ];

      const advisor = new HeuristicCoachAdvisor({
        tactics: [ AlwaysPassTactic ] as any,
        promptResolvers: [ resolverReturning(true) ] as any
      });

      expect(advisor.getRecommendation(state, VIEWER_ID)?.kind).toBe('turn-action');
    });

    it('returns undefined when no resolver can answer the prompt', () => {
      const advisor = new HeuristicCoachAdvisor({
        tactics: [ AlwaysPassTactic ] as any,
        promptResolvers: [ ThrowingResolver ] as any
      });

      expect(advisor.getRecommendation(state, VIEWER_ID)).toBeUndefined();
    });

    it('offers the opposite answer as a validated alternative', () => {
      const advisor = new HeuristicCoachAdvisor({
        promptResolvers: [ resolverReturning(true) ] as any
      });

      const recommendation = advisor.getRecommendation(state, VIEWER_ID);
      const alternatives = recommendation?.alternatives ?? [];

      expect(alternatives.map(alternative => alternative.description)).toContain('No');
      // The recommended answer must not be repeated back as an alternative.
      expect(alternatives.map(alternative => alternative.description)).not.toContain('Yes');
    });

    it('never offers an alternative the prompt itself rejects', () => {
      const selectPrompt = new SelectPrompt(VIEWER_ID, GameMessage.CHOOSE_OPTION,
        [ 'Heads', 'Tails' ], { allowCancel: false });
      selectPrompt.id = 9;
      // Reject every answer except index 0.
      selectPrompt.validate = (result: number | null) => result === 0;
      state.prompts = [ selectPrompt ];

      const advisor = new HeuristicCoachAdvisor({
        promptResolvers: [ resolverReturning(1) ] as any
      });

      const alternatives = advisor.getRecommendation(state, VIEWER_ID)?.alternatives ?? [];

      expect(alternatives.map(alternative => alternative.description)).toEqual([ 'Heads' ]);
    });

    it('offers cancelling when the prompt explicitly permits it', () => {
      const cards = new CardList();
      cards.cards = [ testPokemon('Tarountula') ];
      const chooseCards = new ChooseCardsPrompt(VIEWER_ID, GameMessage.CHOOSE_CARD_TO_HAND, cards,
        { superType: SuperType.POKEMON }, { min: 0, max: 1, allowCancel: true });
      state.prompts = [ chooseCards ];

      const advisor = new HeuristicCoachAdvisor({
        promptResolvers: [ resolverReturning(cards.cards) ] as any
      });

      const alternatives = advisor.getRecommendation(state, VIEWER_ID)?.alternatives ?? [];

      expect(alternatives.map(alternative => alternative.description)).toContain('Decline');
    });

    it('does not offer cancelling when the prompt disallows it', () => {
      const selectPrompt = new SelectPrompt(VIEWER_ID, GameMessage.CHOOSE_OPTION,
        [ 'Heads', 'Tails' ], { allowCancel: false });
      state.prompts = [ selectPrompt ];

      const advisor = new HeuristicCoachAdvisor({
        promptResolvers: [ resolverReturning(0) ] as any
      });

      const alternatives = advisor.getRecommendation(state, VIEWER_ID)?.alternatives ?? [];

      expect(alternatives.map(alternative => alternative.description)).not.toContain('Decline');
    });

  });

});
