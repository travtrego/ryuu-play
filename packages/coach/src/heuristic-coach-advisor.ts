import { Action, Player, State } from '@ptcg/common';
import { allPromptResolvers, allSimpleTactics, defaultArbiterOptions,
  defaultStateScores, SimpleBotOptions } from '@ptcg/simple-bot';
import { CoachActionOption, CoachAdvisor, CoachRecommendation } from './coach-advisor.interface';
import { describeAction } from './action-describer';

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

// Reference CoachAdvisor implementation. It reuses SimpleBot's own tactics -
// the same deterministic logic that already drives AI opponents - so every
// recommendation is guaranteed to be an action the game engine considers
// legal. The "recommended" action is whichever tactic SimpleBot itself would
// play first, following its normal priority order; the remaining legal
// tactics are surfaced as alternatives.
//
// The rationale text here is a static template per tactic type, not real
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

    const candidates = this.findCandidates(state, player);
    if (candidates.length === 0) {
      return undefined;
    }

    const [ recommended, ...alternatives ] = candidates;
    return { ...recommended, alternatives };
  }

  private findCandidates(state: State, player: Player): CoachActionOption[] {
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
        rationale: TACTIC_RATIONALES[TacticClass.name] ?? 'This is a legal option worth considering this turn.'
      });
    }

    return candidates;
  }

}
