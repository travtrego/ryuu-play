import { Action, ChooseCardsPrompt, ConfirmPrompt, Player, Prompt, ResolvePromptAction,
  SelectPrompt, State } from '@ptcg/common';
import { allPromptResolvers, allSimpleTactics, defaultArbiterOptions,
  defaultStateScores, SimpleBotOptions } from '@ptcg/simple-bot';
import { CoachActionOption, CoachAdvisor, CoachRecommendation } from './coach-advisor.interface';
import { describeAction } from './action-describer';
import { describePrompt, describePromptResult } from './prompt-describer';

const TACTIC_RATIONALES: { [tacticName: string]: string } = {
  EvolveTactic: 'Evolving strengthens a Pokémon already on your board without spending a bench slot.',
  PlayBasicTactic: 'Adding another Basic Pokémon gives you more attackers and backup options.',
  PlayFossilTactic: 'Playing this Fossil gives you another Pokémon on the board.',
  AttachEnergyTactic: 'Attaching energy moves you closer to being able to attack.',
  AttachToolTactic: 'Attaching a Tool gives a Pokémon a lasting bonus for the rest of the game.',
  UseDiscardAbilityTactic: 'This Ability creates value from the discard pile at no cost to your hand.',
  PlayTrainerTactic: 'This Item card creates an immediate advantage.',
  PlayStadiumTactic: 'This Stadium changes the rules of play in your favor.',
  PlaySupporterTactic: 'You only get one Supporter per turn, so playing it now banks its effect.',
  UseAbilityTactic: 'Using this Ability creates value without spending your Supporter or Item play.',
  UseStadiumTactic: 'The Stadium already in play still has value to use again.',
  UseTrainerInPlayTactic: 'This card already in play still has value to use.',
  RetreatTactic: 'Retreating protects a damaged Pokémon or gets a better attacker into the Active Spot.',
  AttackTactic: 'Attacking now deals damage and moves you toward taking a Prize card.'
};

const PROMPT_RATIONALES: { [promptType: string]: string } = {
  'Choose cards': 'Which cards you take here shapes the next few turns more than any single attack.',
  'Choose pokemon': 'Pick the target that best protects your board or pressures theirs.',
  'Choose prize': 'Prize choice is usually about what your deck needs back, not what looks strongest.',
  'Attach energy': 'Energy placement decides which attacker comes online, and when.',
  'Choose energy': 'Spend the energy that costs you the least tempo on later turns.',
  'Choose attack': 'Pick the attack whose damage actually changes what your opponent can do next turn.',
  'Move damage': 'Spreading or consolidating damage decides which Pokémon survives the next hit.',
  'Move energy': 'Moving energy can rescue tempo after a knockout.',
  'Order cards': 'Ordering decides what you draw next — put what you need soonest on top.',
  'Put damage': 'Place damage where it sets up a knockout on your following turn.',
  'Select': 'Read each option against your current board before choosing.',
  'Confirm': 'Take the option only if it advances your plan this turn.',
  'Shuffle deck': 'A required shuffle, not a decision — nothing to weigh here.',
  'Show cards': 'Information only. Note what was revealed before continuing.'
};

const DEFAULT_PROMPT_RATIONALE = 'Answer in a way that advances your plan for this turn.';
const DEFAULT_TACTIC_RATIONALE = 'This is a legal option worth considering this turn.';

// Reference CoachAdvisor implementation. It reuses SimpleBot's own logic - the
// same deterministic code that already drives AI opponents - so every
// recommendation is guaranteed to be an action the game engine considers
// legal.
//
// For turn actions, the "recommended" move is whichever tactic SimpleBot would
// play first, following its normal priority order, with the remaining legal
// tactics surfaced as alternatives. For prompts, the recommendation comes from
// SimpleBot's prompt resolvers, and alternatives are candidate answers that the
// prompt's own validate() accepts - the engine stays the authority on what is
// a legal answer.
//
// The rationale text is a static template per tactic or prompt type, not real
// reasoning - it's a placeholder for the "why" explanations described in the
// product concept. A future LLM-backed CoachAdvisor can consume the same
// GameStateSnapshot and candidate actions and swap in generated explanations,
// without touching how legality is determined.
export class HeuristicCoachAdvisor implements CoachAdvisor {

  private options: SimpleBotOptions;

  constructor(options: Partial<SimpleBotOptions> = {}) {
    this.options = Object.assign({
      tactics: allSimpleTactics,
      promptResolvers: allPromptResolvers,
      scores: defaultStateScores,
      arbiter: defaultArbiterOptions
    }, options);
  }

  public getRecommendation(state: State, playerId: number): CoachRecommendation | undefined {
    const player = state.players.find(p => p.id === playerId);
    if (player === undefined) {
      return undefined;
    }

    // An unresolved prompt is the decision in front of the player right now;
    // it takes precedence over anything they could otherwise do this turn.
    const prompt = state.prompts.find(p => p.playerId === playerId && p.result === undefined);
    if (prompt !== undefined) {
      return this.recommendPromptResponse(state, player, prompt);
    }

    return this.recommendTurnAction(state, player);
  }

  private recommendTurnAction(state: State, player: Player): CoachRecommendation | undefined {
    const candidates: CoachActionOption[] = [];

    for (const TacticClass of this.options.tactics) {
      const tactic = new TacticClass(this.options);
      let action: Action | undefined;
      try {
        action = tactic.useTactic(state, player);
      } catch (error) {
        action = undefined;
      }

      if (action === undefined) {
        continue;
      }

      candidates.push({
        action,
        description: describeAction(player, action),
        rationale: TACTIC_RATIONALES[TacticClass.name] ?? DEFAULT_TACTIC_RATIONALE
      });
    }

    if (candidates.length === 0) {
      return undefined;
    }

    const [ recommended, ...alternatives ] = candidates;
    return { ...recommended, kind: 'turn-action', question: null, alternatives };
  }

  private recommendPromptResponse(
    state: State,
    player: Player,
    prompt: Prompt<any>
  ): CoachRecommendation | undefined {
    const resolved = this.resolvePrompt(state, player, prompt);
    if (resolved === undefined) {
      return undefined;
    }

    const rationale = PROMPT_RATIONALES[prompt.type] ?? DEFAULT_PROMPT_RATIONALE;

    return {
      action: resolved,
      description: describePromptResult(prompt, resolved.result),
      rationale,
      kind: 'prompt-response',
      question: describePrompt(prompt),
      alternatives: this.buildPromptAlternatives(state, prompt, resolved)
    };
  }

  private resolvePrompt(
    state: State,
    player: Player,
    prompt: Prompt<any>
  ): ResolvePromptAction | undefined {
    for (const ResolverClass of this.options.promptResolvers) {
      const resolver = new ResolverClass(this.options);
      let action: Action | undefined;
      try {
        action = resolver.resolvePrompt(state, player, prompt);
      } catch (error) {
        action = undefined;
      }

      if (action instanceof ResolvePromptAction) {
        return action;
      }
    }

    return undefined;
  }

  // Candidate answers are proposed here but accepted only if the prompt's own
  // validate() returns true, so an alternative can never be something the
  // engine would reject.
  private buildPromptAlternatives(
    state: State,
    prompt: Prompt<any>,
    recommended: ResolvePromptAction
  ): CoachActionOption[] {
    const candidates = this.proposeAlternativeResults(prompt);
    const alternatives: CoachActionOption[] = [];

    for (const candidate of candidates) {
      if (this.isSameResult(candidate, recommended.result)) {
        continue;
      }
      if (!this.isValidResult(state, prompt, candidate)) {
        continue;
      }

      alternatives.push({
        action: new ResolvePromptAction(prompt.id, candidate),
        description: describePromptResult(prompt, candidate),
        rationale: 'A legal alternative the engine accepts for this prompt.'
      });
    }

    return alternatives;
  }

  private proposeAlternativeResults(prompt: Prompt<any>): any[] {
    const candidates: any[] = [];

    if (prompt instanceof ConfirmPrompt) {
      candidates.push(true, false);
    } else if (prompt instanceof SelectPrompt) {
      prompt.values.forEach((value, index) => candidates.push(index));
    } else if (prompt instanceof ChooseCardsPrompt) {
      // Declining to take anything is a real choice when the prompt permits it.
      candidates.push([]);
    }

    // Cancelling is only ever suggested when the prompt explicitly permits it.
    // validate() alone is not a sufficient gate here: the base Prompt.validate
    // returns true unconditionally, so prompts that never override it - such as
    // SelectPrompt - would appear to accept a cancel they do not actually allow.
    const options = (prompt as any).options;
    if (options?.allowCancel === true) {
      candidates.push(null);
    }

    return candidates;
  }

  private isValidResult(state: State, prompt: Prompt<any>, result: any): boolean {
    try {
      return prompt.validate(result, state) === true;
    } catch (error) {
      return false;
    }
  }

  private isSameResult(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((item, index) => item === b[index]);
    }
    return false;
  }

}
