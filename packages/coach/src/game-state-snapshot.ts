import { Card, ChooseCardsPrompt, GamePhase, Player, PokemonSlot,
  Prompt, SelectPrompt, SpecialCondition, State } from '@ptcg/common';
import { describePrompt } from './prompt-describer';

export interface CardView {
  name: string;
  fullName: string;
  set: string;
}

export interface PokemonSlotSnapshot {
  pokemon: CardView;
  // The whole stack, bottom-up, so a coach can see what a Pokemon evolved from.
  evolutionStack: CardView[];
  hp: number;
  damage: number;
  remainingHp: number;
  energies: CardView[];
  tools: CardView[];
  specialConditions: string[];
}

export interface PlayerSnapshot {
  id: number;
  name: string;
  deckCount: number;
  handCount: number;
  discard: CardView[];
  prizesLeft: number;
  stadium: CardView[];
  supporter: CardView[];
  active: PokemonSlotSnapshot | null;
  // Index-stable: entry N is always player.bench[N], and an empty slot is null
  // rather than omitted. RetreatAction and CardTarget address bench positions
  // by index, so compacting this array would let a recommendation point at the
  // wrong Pokemon.
  bench: (PokemonSlotSnapshot | null)[];
  // Present only for the viewer. Absent - not empty - for the opponent.
  hand?: CardView[];
}

export interface TurnFlags {
  energyAlreadyPlayed: boolean;
  alreadyRetreated: boolean;
  stadiumAlreadyPlayed: boolean;
  stadiumAlreadyUsed: boolean;
}

export interface PromptSnapshot {
  id: number;
  type: string;
  question: string;
  min: number | null;
  max: number | null;
  allowCancel: boolean | null;
  // The options the player picks between, where the prompt enumerates them.
  choices: string[] | null;
}

export interface GameStateSnapshot {
  viewerPlayerId: number;
  turn: number;
  phase: string;
  activePlayerId: number;
  isViewerTurn: boolean;
  you: PlayerSnapshot;
  opponent: PlayerSnapshot;
  turnFlags: TurnFlags;
  pendingPromptCount: number;
  // The question the viewer is being asked, if any. Prompts addressed to the
  // opponent are never included - they are not the viewer's decision, and
  // their contents can be information the viewer is not entitled to.
  pendingPrompt: PromptSnapshot | null;
}

function buildCardView(card: Card): CardView {
  return {
    name: card.name,
    fullName: card.fullName,
    set: card.set
  };
}

function buildPokemonSlotSnapshot(slot: PokemonSlot): PokemonSlotSnapshot | null {
  const pokemonCard = slot.getPokemonCard();

  if (pokemonCard === undefined) {
    return null;
  }

  return {
    pokemon: buildCardView(pokemonCard),
    evolutionStack: slot.getPokemons().map(buildCardView),
    hp: pokemonCard.hp,
    damage: slot.damage,
    remainingHp: Math.max(0, pokemonCard.hp - slot.damage),
    energies: slot.energies.cards.map(buildCardView),
    tools: slot.getTools().map(buildCardView),
    specialConditions: slot.specialConditions.map(condition => SpecialCondition[condition])
  };
}

// Only information that is public knowledge at a real table is included for the
// opponent: discard pile, prize count, board state and hand size. The engine
// internally knows both hands and both decks, so handing State straight to a
// reasoning layer would quietly produce a cheating coach.
function buildPlayerSnapshot(player: Player, isViewer: boolean): PlayerSnapshot {
  const snapshot: PlayerSnapshot = {
    id: player.id,
    name: player.name,
    deckCount: player.deck.cards.length,
    handCount: player.hand.cards.length,
    discard: player.discard.cards.map(buildCardView),
    prizesLeft: player.getPrizeLeft(),
    stadium: player.stadium.cards.map(buildCardView),
    supporter: player.supporter.cards.map(buildCardView),
    active: buildPokemonSlotSnapshot(player.active),
    bench: player.bench.map(buildPokemonSlotSnapshot)
  };

  if (isViewer) {
    snapshot.hand = player.hand.cards.map(buildCardView);
  }

  return snapshot;
}

function buildPromptSnapshot(prompt: Prompt<any>): PromptSnapshot {
  const options = (prompt as any).options;

  const snapshot: PromptSnapshot = {
    id: prompt.id,
    type: prompt.type,
    question: describePrompt(prompt),
    min: typeof options?.min === 'number' ? options.min : null,
    max: typeof options?.max === 'number' ? options.max : null,
    allowCancel: typeof options?.allowCancel === 'boolean' ? options.allowCancel : null,
    choices: null
  };

  if (prompt instanceof SelectPrompt) {
    snapshot.choices = prompt.values.slice();
  } else if (prompt instanceof ChooseCardsPrompt) {
    // Blocked indices are not selectable, so listing them would invite a
    // recommendation the engine would reject.
    snapshot.choices = prompt.cards.cards
      .filter((card, index) => !prompt.options.blocked.includes(index))
      .map(card => card.name);
  }

  return snapshot;
}

// Builds a structured, JSON-serializable summary of the game from one player's
// point of view. This is the boundary between the deterministic simulator and
// any external reasoning layer (e.g. an LLM coach): the simulator remains the
// only source of truth for what is legally possible, and only this plain data
// is handed across the seam.
export function buildGameStateSnapshot(state: State, viewerPlayerId: number): GameStateSnapshot {
  const viewer = state.players.find(player => player.id === viewerPlayerId);
  const opponent = state.players.find(player => player.id !== viewerPlayerId);

  if (viewer === undefined) {
    throw new Error(`Player ${viewerPlayerId} does not exist in this game state.`);
  }

  if (opponent === undefined) {
    throw new Error('Coach snapshots require an opposing player.');
  }

  // state.activePlayer is an index into state.players, not a player id - the
  // engine assigns it with players.indexOf() and toggles it between 0 and 1.
  // Comparing it against a player id directly reports the wrong player's turn.
  const activePlayer = state.players[state.activePlayer];

  const viewerPrompt = state.prompts.find(
    prompt => prompt.playerId === viewerPlayerId && prompt.result === undefined
  );

  return {
    viewerPlayerId,
    turn: state.turn,
    phase: GamePhase[state.phase],
    activePlayerId: activePlayer.id,
    isViewerTurn: activePlayer.id === viewerPlayerId,
    you: buildPlayerSnapshot(viewer, true),
    opponent: buildPlayerSnapshot(opponent, false),
    turnFlags: {
      energyAlreadyPlayed: viewer.energyPlayedTurn === state.turn,
      alreadyRetreated: viewer.retreatedTurn === state.turn,
      stadiumAlreadyPlayed: viewer.stadiumPlayedTurn === state.turn,
      stadiumAlreadyUsed: viewer.stadiumUsedTurn === state.turn
    },
    // Resolved prompts stay in state.prompts with their result set, so an
    // unfiltered length would overstate how much is actually pending.
    pendingPromptCount: state.prompts.filter(prompt => prompt.result === undefined).length,
    pendingPrompt: viewerPrompt === undefined ? null : buildPromptSnapshot(viewerPrompt)
  };
}
