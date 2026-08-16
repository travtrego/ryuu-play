import { GamePhase, Player, PokemonSlot, SpecialCondition, State } from '@ptcg/common';

export interface PokemonSlotSnapshot {
  pokemonNames: string[];
  hp: number;
  damage: number;
  energyNames: string[];
  toolNames: string[];
  specialConditions: string[];
}

export interface PlayerSnapshot {
  id: number;
  name: string;
  deckCount: number;
  discardCardNames: string[];
  prizesLeft: number;
  stadiumCardName: string | undefined;
  active: PokemonSlotSnapshot;
  bench: PokemonSlotSnapshot[];
  handCount: number;
  handCardNames?: string[];
}

export interface GameStateSnapshot {
  turn: number;
  phase: string;
  activePlayerId: number;
  viewerPlayerId: number;
  you: PlayerSnapshot;
  opponent: PlayerSnapshot;
}

function buildPokemonSlotSnapshot(slot: PokemonSlot): PokemonSlotSnapshot {
  const pokemonCard = slot.getPokemonCard();

  return {
    pokemonNames: slot.getPokemons().map(card => card.name),
    hp: pokemonCard === undefined ? 0 : pokemonCard.hp,
    damage: slot.damage,
    energyNames: slot.energies.cards.map(card => card.name),
    toolNames: slot.getTools().map(card => card.name),
    specialConditions: slot.specialConditions.map(condition => SpecialCondition[condition])
  };
}

// Only information that is public knowledge in a real game (discard pile, prize
// count, board state, hand size) is included for the opponent. Their hand
// contents are only revealed when `isViewer` is true.
function buildPlayerSnapshot(player: Player, isViewer: boolean): PlayerSnapshot {
  const snapshot: PlayerSnapshot = {
    id: player.id,
    name: player.name,
    deckCount: player.deck.cards.length,
    discardCardNames: player.discard.cards.map(card => card.name),
    prizesLeft: player.getPrizeLeft(),
    stadiumCardName: player.stadium.cards[player.stadium.cards.length - 1]?.name,
    active: buildPokemonSlotSnapshot(player.active),
    bench: player.bench.map(buildPokemonSlotSnapshot),
    handCount: player.hand.cards.length
  };

  if (isViewer) {
    snapshot.handCardNames = player.hand.cards.map(card => card.name);
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

  if (viewer === undefined || opponent === undefined) {
    throw new Error(`Player ${viewerPlayerId} not found in the given state.`);
  }

  return {
    turn: state.turn,
    phase: GamePhase[state.phase],
    activePlayerId: state.players[state.activePlayer].id,
    viewerPlayerId,
    you: buildPlayerSnapshot(viewer, true),
    opponent: buildPlayerSnapshot(opponent, false)
  };
}
