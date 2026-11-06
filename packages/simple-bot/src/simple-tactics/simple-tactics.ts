import { Action, Player, State, PokemonSlot, CardTarget, PlayerType,
  SlotType, GameError, GameMessage, Prompt, ResolvePromptAction, PlayCardAction,
  UseAbilityAction, UseStadiumAction, UseTrainerInPlayAction, AttackAction,
  RetreatAction, TrainerCard, TrainerType } from '@ptcg/common';
import { Simulator } from '@ptcg/common';
import { SimpleBotOptions } from '../simple-bot-options';
import { StateScore } from '../state-score/state-score';
import { describeChanges, getOwnSlot, joinList, pokemonName } from '../explain/explain-utils';

export type SimpleTacticList = (new (options: SimpleBotOptions) => SimpleTactic)[];

export abstract class SimpleTactic {

  private stateScore: StateScore;

  constructor(protected options: SimpleBotOptions) {
    this.stateScore = new StateScore(this.options);
  }

  public abstract useTactic(state: State, player: Player): Action | undefined;

  /**
   * Plain-language reason for an action this tactic just returned from
   * useTactic(), computed from the same state the tactic looked at.
   *
   * The default covers the tactics that pick "whatever scores best in a
   * simulation" (trainers, abilities, stadiums, tools): it names the action
   * and lists what the bot's own simulation predicts will change. Tactics
   * with a more specific rule override it.
   */
  public explain(state: State, player: Player, action: Action): string {
    const what = this.describeAction(state, player, action);
    const after = this.simulateAction(state, action);
    const facts = after !== undefined ? describeChanges(state, after, player.id) : [];
    if (facts.length > 0) {
      return `${what}: it ${joinList(facts)}.`;
    }
    return `${what}. The bot tried it in a simulation and the result scored better than not doing it.`;
  }

  /** Short name of an action, e.g. "Played Potion" or "Used Rain Dance". */
  protected describeAction(state: State, player: Player, action: Action): string {
    if (action instanceof PlayCardAction) {
      const card = player.hand.cards[action.handIndex];
      const name = card ? card.name : 'a card';
      const slot = action.target.player === PlayerType.BOTTOM_PLAYER
        ? getOwnSlot(player, action.target) : undefined;
      if (slot !== undefined && slot.pokemons.cards.length > 0) {
        const isTool = card instanceof TrainerCard && card.trainerType === TrainerType.TOOL;
        return isTool
          ? `Attached ${name} to ${pokemonName(slot)}`
          : `Played ${name} on ${pokemonName(slot)}`;
      }
      return `Played ${name}`;
    }
    if (action instanceof UseAbilityAction) {
      const slot = getOwnSlot(player, action.target);
      return `Used ${pokemonName(slot)}'s ${action.name}`;
    }
    if (action instanceof UseStadiumAction) {
      const stadium = state.players
        .map(p => p.stadium.cards[0])
        .find(c => c !== undefined);
      return `Used the Stadium ${stadium ? stadium.name : ''}`.trim();
    }
    if (action instanceof UseTrainerInPlayAction) {
      return `Used ${action.cardName}`;
    }
    if (action instanceof AttackAction) {
      return `Attacked with ${pokemonName(player.active)}'s ${action.name}`;
    }
    if (action instanceof RetreatAction) {
      return `Retreated ${pokemonName(player.active)} for ${pokemonName(player.bench[action.benchIndex])}`;
    }
    return 'Took an action';
  }

  protected getCardTarget(player: Player, state: State, target: PokemonSlot): CardTarget {
    if (target === player.active) {
      return { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
    }

    for (let index = 0; index < player.bench.length; index++) {
      if (target === player.bench[index]) {
        return { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index };
      }
    }

    const opponent = state.players.find(p => p !== player);
    if (opponent === undefined) {
      throw new GameError(GameMessage.INVALID_GAME_STATE);
    }

    if (target === opponent.active) {
      return { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
    }

    for (let index = 0; index < opponent.bench.length; index++) {
      if (target === opponent.bench[index]) {
        return { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index };
      }
    }

    throw new GameError(GameMessage.INVALID_TARGET);
  }

  protected simulateAction(state: State, action: Action): State | undefined {
    let newState = state;
    try {
      const simulator = new Simulator(state, this.options.arbiter);
      newState = simulator.dispatch(action);
      
      while (simulator.store.state.prompts.some(p => p.result === undefined)) {
        newState = simulator.store.state;
        const prompt = newState.prompts.find(p => p.result === undefined);
        if (prompt === undefined) {
          break;
        }
        const player = newState.players.find(p => p.id === prompt.playerId);
        if (player === undefined) {
          break;
        }
        const resolveAction = this.resolvePrompt(newState, player, prompt);
        newState = simulator.dispatch(resolveAction);
      }
    } catch (error) {
      return undefined;
    }

    return newState;
  }

  private resolvePrompt(state: State, player: Player, prompt: Prompt<any>): Action {
    const resolvers = this.options.promptResolvers.map(resolver => new resolver(this.options));

    for (let i = 0; i < resolvers.length; i++) {
      const action = resolvers[i].resolvePrompt(state, player, prompt);
      if (action !== undefined) {
        return action;
      }
    }

    // Unknown prompt. Try to cancel it.
    return new ResolvePromptAction(prompt.id, null);
  }

  protected getStateScore(state: State, playerId: number): number {
    return this.stateScore.getScore(state, playerId);
  }

  protected evaluateAction(state: State, playerId: number, action: Action, passTurnScore: number = 0): number | undefined {
    const newState = this.simulateAction(state, action);
    const newPlayer = newState && newState.players.find(p => p.id === playerId);
    if (newState !== undefined && newPlayer !== undefined) {
      return this.stateScore.getScore(newState, playerId)
        + (newState.turn > state.turn ? passTurnScore : 0);
    }
  }

}
