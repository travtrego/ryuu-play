// Test-only helpers for the reducer specs (*.spec.ts in this folder).
// The common package cannot import packages/sets, so small test cards live here.

import { Action } from '../actions/action';
import { Card } from '../card/card';
import { CardList } from '../state/card-list';
import { CardManager } from '../../game/cards/card-manager';
import { Effect } from '../effects/effect';
import { EnergyCard } from '../card/energy-card';
import { GameError } from '../../game-error';
import { GamePhase, State } from '../state/state';
import { Player } from '../state/player';
import { PokemonCard } from '../card/pokemon-card';
import { PokemonSlot } from '../state/pokemon-slot';
import { Prompt } from '../prompts/prompt';
import { ResolvePromptAction } from '../actions/resolve-prompt-action';
import { CardType, Stage, TrainerType } from '../card/card-types';
import { Store } from '../store';
import { StoreLike } from '../store-like';
import { TrainerCard } from '../card/trainer-card';
import { Attack, Power, PowerType } from '../card/pokemon-types';
import { WhoBeginsEffect } from '../effects/game-phase-effects';

const SET = 'RTEST';

/** Base for test cards: remembers every effect it received. */
function recordEffect(card: { effects: Effect[] }, effect: Effect) {
  card.effects.push(effect);
}

export class TestBasic extends PokemonCard {
  public set = SET;
  public name: string;
  public fullName: string;
  public stage = Stage.BASIC;
  public hp = 100;
  public attacks: Attack[] = [{ name: 'Test attack', cost: [], damage: '10', text: '' }];
  public powers: Power[] = [];
  public effects: Effect[] = [];

  constructor(name: string = 'Test Basic', powers: Power[] = []) {
    super();
    this.name = name;
    this.fullName = name + ' ' + SET;
    this.powers = powers;
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    recordEffect(this, effect);
    return state;
  }
}

export class TestStage1 extends PokemonCard {
  public set = SET;
  public name = 'Test Stage 1';
  public fullName = 'Test Stage 1 ' + SET;
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Test Basic';
  public hp = 120;
  public attacks: Attack[] = [];
}

export class TestEnergy extends EnergyCard {
  public set = SET;
  public name = 'Test Energy';
  public fullName = 'Test Energy ' + SET;
  public provides: CardType[] = [CardType.COLORLESS];
}

export class TestTrainer extends TrainerCard {
  public set = SET;
  public name: string;
  public fullName: string;
  public effects: Effect[] = [];

  constructor(name: string, trainerType: TrainerType, useWhenInPlay: boolean = false) {
    super();
    this.name = name;
    this.fullName = name + ' ' + SET;
    this.trainerType = trainerType;
    this.useWhenInPlay = useWhenInPlay;
  }

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    recordEffect(this, effect);
    return state;
  }
}

/** Sets WhoBeginsEffect.player to the second player when it is in any zone. */
export class TestSecondBegins extends PokemonCard {
  public set = SET;
  public name = 'Test Second Begins';
  public fullName = 'Test Second Begins ' + SET;
  public stage = Stage.BASIC;
  public hp = 100;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof WhoBeginsEffect && effect.player === undefined) {
      effect.player = state.players[1];
    }
    return state;
  }
}

export const power = (name: string, opts: Partial<Power> = {}): Power => Object.assign({
  name,
  powerType: PowerType.ABILITY,
  text: ''
}, opts);

/** Cards registered in the CardManager singleton for setup tests (defined once). */
export const setupCards = {
  basic: new TestBasic('Setup Basic'),
  energy: new TestEnergy(),
  secondBegins: new TestSecondBegins()
};

export const SETUP_FORMAT = 'Reducer Test Format';

export function registerSetupCards(): void {
  const cardManager = CardManager.getInstance();
  const cards: Card[] = [setupCards.basic, setupCards.energy, setupCards.secondBegins];
  const missing = cards.filter(c => !cardManager.isCardDefined(c.fullName));
  if (missing.length > 0) {
    cardManager.defineSet(missing);
  }
  if (!cardManager.getAllFormats().some(f => f.name === SETUP_FORMAT)) {
    cardManager.defineFormat(SETUP_FORMAT, [cards]);
  }
}

/** Builds a 60 card deck: `pokemons` placed at given indexes, rest energies. */
export function makeDeck(pokemonIndexes: number[] = [0, 1, 2, 3], pokemonName = setupCards.basic.fullName): string[] {
  const deck: string[] = [];
  for (let i = 0; i < 60; i++) {
    deck.push(pokemonIndexes.includes(i) ? pokemonName : setupCards.energy.fullName);
  }
  return deck;
}

export class TestStoreHandler {
  public changes = 0;
  onStateChange(state: State): void {
    this.changes++;
  }
}

export function createStore(state?: State): Store {
  const store = new Store(new TestStoreHandler());
  if (state) {
    store.state = state;
  }
  return store;
}

/** A two-player state in PLAYER_TURN, with active Pokemon, 5 bench slots and 6 prizes. */
export function createTurnState(turn: number = 3): State {
  const state = new State();
  for (let p = 0; p < 2; p++) {
    const player = new Player();
    player.id = p + 1;
    player.name = 'Player ' + (p + 1);
    player.active.pokemons.cards = [new TestBasic()];
    for (let i = 0; i < 20; i++) {
      player.deck.cards.push(new TestEnergy());
    }
    for (let i = 0; i < 5; i++) {
      player.bench.push(new PokemonSlot());
    }
    for (let i = 0; i < 6; i++) {
      const prize = new CardList();
      prize.cards = [new TestEnergy()];
      player.prizes.push(prize);
    }
    state.players.push(player);
  }
  state.phase = GamePhase.PLAYER_TURN;
  state.turn = turn;
  state.activePlayer = 0;
  return state;
}

export function unresolved(store: Store): Prompt<any>[] {
  return store.state.prompts.filter(p => p.result === undefined);
}

export function resolve(store: Store, prompt: Prompt<any>, result: any): State {
  return store.dispatch(new ResolvePromptAction(prompt.id, result));
}

/** Identity order for a shuffle prompt of the given player. */
export function identityOrder(store: Store, playerId: number): number[] {
  const player = store.state.players.find(p => p.id === playerId) as Player;
  return player.deck.cards.map((c, i) => i);
}

export function errorOf(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    if (error instanceof GameError) {
      return error.message;
    }
    throw error;
  }
  return '';
}

export function dispatchError(store: Store, action: Action): string {
  return errorOf(() => store.dispatch(action));
}
