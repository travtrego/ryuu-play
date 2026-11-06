export interface CoachCardView {
  name: string;
  fullName: string;
  set: string;
}

export interface CoachPokemonView {
  pokemon: CoachCardView;
  evolutionStack: CoachCardView[];
  hp: number;
  damage: number;
  remainingHp: number;
  energies: CoachCardView[];
  tools: CoachCardView[];
  specialConditions: string[];
}

export interface CoachPublicPlayerView {
  id: number;
  name: string;
  deckCount: number;
  handCount: number;
  discard: CoachCardView[];
  prizeCount: number;
  active: CoachPokemonView | null;
  bench: CoachPokemonView[];
  stadium: CoachCardView[];
  supporter: CoachCardView[];
}

export interface CoachSelfPlayerView extends CoachPublicPlayerView {
  hand: CoachCardView[];
}

export interface CoachTurnFlags {
  energyAlreadyPlayed: boolean;
  alreadyRetreated: boolean;
  stadiumAlreadyPlayed: boolean;
  stadiumAlreadyUsed: boolean;
}

/**
 * Deliberately separates the player's private information from the opponent's
 * public information. An external coach should never receive the opponent's
 * hidden hand/deck contents just because the simulator internally knows them.
 */
export interface CoachGameSnapshot {
  viewerPlayerId: number;
  turn: number;
  phase: string;
  activePlayerId: number;
  isViewerTurn: boolean;
  self: CoachSelfPlayerView;
  opponent: CoachPublicPlayerView;
  turnFlags: CoachTurnFlags;
  pendingPromptCount: number;
}

export interface CoachRecommendation {
  summary: string;
  rationale: string;
  confidence?: number;
  alternatives?: string[];
}
