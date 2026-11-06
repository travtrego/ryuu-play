import {
  Card,
  GamePhase,
  Player,
  PokemonSlot,
  SpecialCondition,
  State,
} from '@ptcg/common';
import {
  CoachCardView,
  CoachGameSnapshot,
  CoachPokemonView,
  CoachPublicPlayerView,
  CoachSelfPlayerView,
} from './coach-types';

function cardView(card: Card): CoachCardView {
  return {
    name: card.name,
    fullName: card.fullName,
    set: card.set,
  };
}

function pokemonView(slot: PokemonSlot): CoachPokemonView | null {
  const pokemon = slot.getPokemonCard();
  if (pokemon === undefined) {
    return null;
  }

  return {
    pokemon: cardView(pokemon),
    evolutionStack: slot.getPokemons().map(cardView),
    hp: pokemon.hp,
    damage: slot.damage,
    remainingHp: Math.max(0, pokemon.hp - slot.damage),
    energies: slot.energies.cards.map(cardView),
    tools: slot.getTools().map(cardView),
    specialConditions: slot.specialConditions.map(condition => SpecialCondition[condition]),
  };
}

function publicPlayerView(player: Player): CoachPublicPlayerView {
  return {
    id: player.id,
    name: player.name,
    deckCount: player.deck.cards.length,
    handCount: player.hand.cards.length,
    discard: player.discard.cards.map(cardView),
    prizeCount: player.getPrizeLeft(),
    active: pokemonView(player.active),
    bench: player.bench
      .map(pokemonView)
      .filter((pokemon): pokemon is CoachPokemonView => pokemon !== null),
    stadium: player.stadium.cards.map(cardView),
    supporter: player.supporter.cards.map(cardView),
  };
}

function selfPlayerView(player: Player): CoachSelfPlayerView {
  return {
    ...publicPlayerView(player),
    hand: player.hand.cards.map(cardView),
  };
}

/**
 * Converts RyuuPlay's internal State into the information an honest human
 * player would be allowed to use while receiving coaching.
 *
 * The simulator internally knows both decks and both hands. Passing State
 * directly to an LLM would therefore create an accidental cheating bot. This
 * boundary intentionally exposes the viewer's hand while reducing the
 * opponent's hidden zones to counts only.
 */
export function stateToCoachSnapshot(state: State, viewerPlayerId: number): CoachGameSnapshot {
  const viewer = state.players.find(player => player.id === viewerPlayerId);
  if (viewer === undefined) {
    throw new Error(`Player ${viewerPlayerId} does not exist in this game state.`);
  }

  const opponent = state.players.find(player => player.id !== viewerPlayerId);
  if (opponent === undefined) {
    throw new Error('Coach snapshots require an opposing player.');
  }

  return {
    viewerPlayerId,
    turn: state.turn,
    phase: GamePhase[state.phase],
    activePlayerId: state.activePlayer,
    isViewerTurn: state.activePlayer === viewerPlayerId,
    self: selfPlayerView(viewer),
    opponent: publicPlayerView(opponent),
    turnFlags: {
      energyAlreadyPlayed: viewer.energyPlayedTurn === state.turn,
      alreadyRetreated: viewer.retreatedTurn === state.turn,
      stadiumAlreadyPlayed: viewer.stadiumPlayedTurn === state.turn,
      stadiumAlreadyUsed: viewer.stadiumUsedTurn === state.turn,
    },
    pendingPromptCount: state.prompts.length,
  };
}
