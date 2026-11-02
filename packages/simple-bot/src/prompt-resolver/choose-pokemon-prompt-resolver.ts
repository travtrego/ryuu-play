import { Player, State, Action, ResolvePromptAction, Prompt, PokemonSlot,
  PlayerType, SlotType, StateUtils, GameMessage, EnergyMap } from '@ptcg/common';
import { PromptResolver } from './prompt-resolver';
import { ChoosePokemonPrompt } from '@ptcg/common';
import { joinList } from '../explain/explain-utils';

interface PlayerCardList {
  pokemonSlot: PokemonSlot;
  player: PlayerType;
}

/** What the chosen Pokémon is for, phrased to follow "Chose Pikachu ...". */
const PROMPT_PURPOSE: { [message: string]: string } = {
  [GameMessage.CHOOSE_NEW_ACTIVE_POKEMON]: 'as its new Active Pokémon',
  [GameMessage.CHOOSE_POKEMON_TO_SWITCH]: 'to switch into the Active Spot',
  [GameMessage.CHOOSE_POKEMON_TO_DAMAGE]: 'to take the damage',
  [GameMessage.CHOOSE_POKEMON_TO_HEAL]: 'to heal',
  [GameMessage.CHOOSE_POKEMON_TO_DISCARD]: 'to discard',
  [GameMessage.CHOOSE_POKEMON_TO_DISCARD_CARDS]: 'to discard cards from',
  [GameMessage.CHOOSE_POKEMON_TO_PICK_UP]: 'to pick up',
  [GameMessage.CHOOSE_POKEMON_TO_EVOLVE]: 'to evolve',
  [GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS]: 'to attach cards to'
};

/** The factors of StateScore.getPokemonScore, which this resolver ranks by. */
const BASE_MEASURE = 'comparing HP, attack damage, Abilities and Retreat Cost';

/**
 * Prompts that put the chosen Pokémon into the Active Spot. For these the
 * ranking also counts whether the Pokémon can already pay for an attack,
 * so the measure is described with that factor added.
 */
const ACTIVE_MESSAGES: GameMessage[] = [
  GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,
  GameMessage.CHOOSE_POKEMON_TO_SWITCH
];
const ACTIVE_MEASURE = 'first whether the attached Energy already pays for an attack, '
  + 'then HP, attack damage, Abilities and Retreat Cost';

export class ChoosePokemonPromptResolver extends PromptResolver {

  public resolvePrompt(state: State, player: Player, prompt: Prompt<any>): Action | undefined {
    if (prompt instanceof ChoosePokemonPrompt) {
      const items = this.buildPokemonToChoose(state, prompt);
      const result = this.getPromptResult(prompt, items);
      return new ResolvePromptAction(prompt.id, result);
    }
  }

  /**
   * Learn mode. Every Pokémon in play is public, so the reason can name the
   * choice. It describes the ranking getPromptResult() actually used: the
   * Pokémon score (HP, attack damage, Abilities, Retreat Cost), highest
   * first for helpful effects on its own Pokémon and harmful effects on the
   * opponent's, lowest first otherwise.
   */
  public explain(state: State, player: Player, prompt: Prompt<any>, action: Action): string {
    if (!(prompt instanceof ChoosePokemonPrompt) || !(action instanceof ResolvePromptAction)) {
      return '';
    }
    const purpose = PROMPT_PURPOSE[prompt.message] || 'for the effect';
    const measure = this.countsEnergy(prompt) ? ACTIVE_MEASURE : BASE_MEASURE;
    const items = this.buildPokemonToChoose(state, prompt);
    const chosen: PokemonSlot[] | null = action.result;

    if (chosen === null || chosen.length === 0) {
      if (items.length === 0) {
        return '';
      }
      return `Chose no Pokémon ${purpose}: by the bot's measure (${measure}) `
        + 'none of the choices would leave it better off.';
    }

    const picked = chosen
      .map(slot => items.find(item => item.pokemonSlot === slot))
      .filter((item): item is PlayerCardList => item !== undefined);
    if (picked.length !== chosen.length) {
      return '';
    }
    const names = picked.map(item => this.describeOwner(item));

    if (picked.length > 1) {
      return `Chose ${joinList(names)} ${purpose}: they rank highest for this choice by the bot's measure `
        + `(${measure}).`;
    }

    const item = picked[0];
    if (items.length === 1) {
      return `Chose ${names[0]} ${purpose}: it was the only choice.`;
    }
    const sameSide = items.filter(i => i.player === item.player);
    const side = item.player === PlayerType.TOP_PLAYER ? 'the opponent\'s' : 'its own';
    if (sameSide.length === 1) {
      return `Chose ${names[0]} ${purpose}: it was the only choice among ${side} Pokémon.`;
    }

    const score = this.getBaseScore(prompt, item.pokemonSlot);
    const scores = sameSide.map(i => this.getBaseScore(prompt, i.pokemonSlot));
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    if (max === min) {
      return `Chose ${names[0]} ${purpose}: ${side} Pokémon all rank equally by the bot's measure `
        + `(${measure}), so it took the first one.`;
    }
    const rank = score === max ? 'strongest' : score === min ? 'weakest' : '';
    if (rank === '') {
      return `Chose ${names[0]} ${purpose}: it ranks highest for this choice by the bot's measure (${measure}).`;
    }
    const ready = this.countsEnergy(prompt) ? this.readyNote(item, sameSide) : '';
    return `Chose ${names[0]} ${purpose}: it is ${side} ${rank} Pokémon by the bot's measure `
      + `(${measure}).${ready}`;
  }

  /**
   * One extra sentence when attack-ready Energy decided the choice, so a
   * learner sees the rule of thumb: put up a Pokémon that can attack.
   */
  private readyNote(item: PlayerCardList, sameSide: PlayerCardList[]): string {
    const ready = this.canPayForAnAttack(item.pokemonSlot);
    const othersReady = sameSide.filter(i => i !== item && this.canPayForAnAttack(i.pokemonSlot)).length;
    const othersNotReady = sameSide.length - 1 - othersReady;
    if (item.player === PlayerType.BOTTOM_PLAYER && ready && othersNotReady > 0) {
      return ' Its attached Energy already pays for an attack, so it can attack right away.';
    }
    if (item.player === PlayerType.TOP_PLAYER && !ready && othersReady > 0) {
      return ' It does not have the Energy for any of its attacks yet, so it cannot attack right away.';
    }
    return '';
  }

  /** Whether attack-ready Energy is part of the ranking for this prompt. */
  private countsEnergy(prompt: ChoosePokemonPrompt): boolean {
    return ACTIVE_MESSAGES.includes(prompt.message)
      && this.options.scores.activeChoice.canAttack !== 0;
  }

  /**
   * The Pokémon score the ranking starts from: StateScore.getPokemonScore,
   * plus the canAttack bonus when the Pokémon is going into the Active Spot.
   */
  private getBaseScore(prompt: ChoosePokemonPrompt, pokemonSlot: PokemonSlot): number {
    let score = this.stateScore.getPokemonScore(pokemonSlot);
    if (this.countsEnergy(prompt) && this.canPayForAnAttack(pokemonSlot)) {
      score += this.options.scores.activeChoice.canAttack;
    }
    return score;
  }

  /**
   * Whether the Energy attached to the Pokémon covers the cost of at least
   * one of its attacks, counting what each Energy card provides as printed
   * (the same reading StateScore's EnergyScore uses; effects that change
   * what Energy provides are not simulated here). An attack with no cost
   * counts as payable.
   */
  private canPayForAnAttack(pokemonSlot: PokemonSlot): boolean {
    const card = pokemonSlot.getPokemonCard();
    if (card === undefined || card.attacks.length === 0) {
      return false;
    }
    const energy: EnergyMap[] = pokemonSlot.energies.cards.map(c => ({
      card: c, provides: c.provides, provideAmount: c.provideAmount
    }));
    return card.attacks.some(a => StateUtils.checkEnoughEnergy(energy, a.cost));
  }

  private describeOwner(item: PlayerCardList): string {
    const card = item.pokemonSlot.getPokemonCard();
    const name = card ? card.name : 'a Pokémon';
    return item.player === PlayerType.TOP_PLAYER ? `the opponent's ${name}` : name;
  }

  private getPromptResult(prompt: ChoosePokemonPrompt, pokemons: PlayerCardList[]): PokemonSlot[] | null {
    const items = pokemons.map(item => {
      const score = this.getPokemonScoreForPrompt(prompt, item);
      return { pokemonSlot: item.pokemonSlot, score };
    });
    items.sort((a, b) => b.score - a.score);

    const result: PokemonSlot[] = [];
    const min = prompt.options.min;
    const max = prompt.options.max;
    let score = 0;

    while (items.length > 0 && (items[0].score > 0 || result.length < min)) {
      const item = items.shift();
      if (item === undefined) {
        break;
      }
      result.push(item.pokemonSlot);
      score += item.score;

      if (result.length >= max) {
        break;
      }
    }

    if (result.length === 0 && prompt.options.allowCancel) {
      return null;
    }

    if (score < 0 && prompt.options.allowCancel) {
      return null;
    }

    return result;
  }

  private getPokemonScoreForPrompt(prompt: ChoosePokemonPrompt, item: PlayerCardList): number {
    let score = this.getBaseScore(prompt, item.pokemonSlot);

    if (item.player === PlayerType.TOP_PLAYER) {
      score = -score;
    }

    // reverse messages
    const weakestMessages: GameMessage[] = [
      GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      GameMessage.CHOOSE_POKEMON_TO_DISCARD,
      GameMessage.CHOOSE_POKEMON_TO_DISCARD_CARDS,
      GameMessage.CHOOSE_POKEMON_TO_PICK_UP
    ];

    if (weakestMessages.includes(prompt.message)) {
      score = -score;
    }

    return score;
  }

  private buildPokemonToChoose(state: State, prompt: ChoosePokemonPrompt): PlayerCardList[] {
    const player = state.players.find(p => p.id === prompt.playerId);
    const opponent = state.players.find(p => p.id !== prompt.playerId);
    if (player === undefined || opponent === undefined) {
      return [];
    }
    const hasOpponent = [PlayerType.TOP_PLAYER, PlayerType.ANY].includes(prompt.playerType);
    const hasPlayer = [PlayerType.BOTTOM_PLAYER, PlayerType.ANY].includes(prompt.playerType);
    const hasBench = prompt.slots.includes(SlotType.BENCH);
    const hasActive = prompt.slots.includes(SlotType.ACTIVE);

    let result: PlayerCardList[] = [];
    if (hasOpponent && hasBench) {
      opponent.bench.filter(b => b.pokemons.cards.length).forEach(b => {
        result.push({ pokemonSlot: b, player: PlayerType.TOP_PLAYER });
      });
    }
    if (hasOpponent && hasActive) {
      result.push({ pokemonSlot: opponent.active, player: PlayerType.TOP_PLAYER });
    }
    if (hasPlayer && hasActive) {
      result.push({ pokemonSlot: player.active, player: PlayerType.BOTTOM_PLAYER });
    }
    if (hasPlayer && hasBench) {
      player.bench.filter(b => b.pokemons.cards.length).forEach(b => {
        result.push({ pokemonSlot: b, player: PlayerType.BOTTOM_PLAYER });
      });
    }

    const blocked = prompt.options.blocked.map(b => StateUtils.getTarget(state, player, b));
    result = result.filter(r => !blocked.includes(r.pokemonSlot));
    return result;
  }

}
