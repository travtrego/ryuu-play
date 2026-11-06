import { AbortGameAction, AbortGameReason, Action, AddPlayerAction, BotAi, BotAiFactory,
  GameError, GameLog, GamePhase, GameWinner, Rules, State, Store, StoreHandler } from '@ptcg/common';
import { Prng } from './prng';
import { SeededArbiter } from './seeded-arbiter';

export interface GameSeat {
  /** Player name shown in the game state and logs. */
  name: string;
  bot: BotAiFactory;
  deck: string[];
}

export interface GameLimits {
  /** Game is aborted by the guard once state.turn exceeds this. */
  maxTurns: number;
  /** Bot actions (valid or not) allowed per game. */
  maxActions: number;
  /** Bot actions (valid or not) allowed within a single turn. */
  maxActionsPerTurn: number;
  /**
   * Consecutive rejected actions from one player before the game is aborted
   * with AbortGameReason.ILLEGAL_MOVES. The server uses 15 (Game.maxInvalidMoves).
   */
  maxInvalidMoves: number;
}

export const defaultGameLimits: GameLimits = {
  maxTurns: 200,
  maxActions: 5000,
  maxActionsPerTurn: 250,
  maxInvalidMoves: 15
};

export type GameOutcome =
  /** Game finished with a winner (state.winner is PLAYER_1 or PLAYER_2). */
  'win'
  /** Game finished as GameWinner.DRAW. */
  | 'draw'
  /** Game finished with GameWinner.NONE (e.g. finished before it started). */
  | 'no-winner'
  /** The loop guard stopped the game (see guardReason). */
  | 'guard'
  /** Nobody could act: no bot returned an action and no arbiter prompt was pending. */
  | 'stalled'
  /** A player exceeded maxInvalidMoves consecutive rejected actions. */
  | 'illegal-moves'
  /** An unexpected (non-GameError) exception was thrown by the engine or a bot. */
  | 'error';

export type GuardReason = 'max-turns' | 'max-actions' | 'max-actions-per-turn';

export type EndReason = 'prizes' | 'no-active' | 'deck-out';

const endReasonLogs: { [message: string]: EndReason | undefined } = {
  [GameLog.LOG_PLAYER_NO_PRIZE_CARD]: 'prizes',
  [GameLog.LOG_PLAYER_NO_ACTIVE_POKEMON]: 'no-active',
  [GameLog.LOG_PLAYER_NO_CARDS_IN_DECK]: 'deck-out'
};

export interface GameErrorInfo {
  /** 'dispatch' = thrown by Store.dispatch, 'decode' = thrown by BotAi.decodeNextAction. */
  source: 'dispatch' | 'decode' | 'setup';
  message: string;
  stack?: string;
  /** Seat index (0/1) of the player whose action/decision triggered it, if any. */
  seat?: number;
  action?: string;
  turn: number;
  phase: string;
}

export interface GameResult {
  seed: number;
  outcome: GameOutcome;
  /** Seat index (0 = players[0]) of the winner, when outcome is 'win'. */
  winnerSeat?: number;
  /** Seat index that took turn 1, if the game got that far. */
  firstSeat?: number;
  guardReason?: GuardReason;
  /** Seat whose rejected actions caused an 'illegal-moves' abort. */
  illegalMovesSeat?: number;
  error?: GameErrorInfo;
  /** state.turn when the game ended. */
  turns: number;
  /** Bot actions dispatched (including rejected ones). */
  actions: number;
  /** Arbiter prompt resolutions (shuffles, coin flips). */
  arbiterActions: number;
  /** Rejected (GameError) bot actions per seat. */
  invalidMoves: [number, number];
  /** GameError messages of rejected actions, with counts. */
  invalidMoveMessages: { [message: string]: number };
  prizesLeft: [number, number];
  /**
   * Why the engine ended the game, from its end-of-game log lines:
   * 'prizes' (a player took every prize), 'no-active' (a player had no
   * Pokemon left to promote) or 'deck-out' (a player could not draw).
   * Empty when the game did not finish normally.
   */
  endReasons: EndReason[];
  finalPhase: string;
  /** Wall-clock duration. Not deterministic; excluded from determinism checks. */
  durationMs: number;
}

class NoopHandler implements StoreHandler {
  public onStateChange(state: State): void { }
}

function describeAction(action: Action): string {
  const name = action.constructor && action.constructor.name;
  return name || action.type;
}

function errorInfo(error: unknown, base: Omit<GameErrorInfo, 'message' | 'stack'>): GameErrorInfo {
  if (error instanceof Error) {
    return { ...base, message: `${error.name}: ${error.message}`, stack: error.stack };
  }
  if (error instanceof GameError) {
    return { ...base, message: `GameError: ${error.message}` };
  }
  return { ...base, message: String(error) };
}

/**
 * Plays one complete game between two bots, synchronously and headlessly.
 *
 * This mirrors how the server drives bot games (Core.createGame ->
 * Game.dispatch, Arbiter for shuffles/coin flips, BotGameHandler asking each
 * BotAi for its next action on every state change), minus the network,
 * database, timers and the server's per-action setTimeout delay:
 *
 *  1. both decks are added with AddPlayerAction (seat 0 then seat 1);
 *  2. loop: pending ShuffleDeck/CoinFlip prompts are resolved by a seeded
 *     arbiter; otherwise each bot (seat 0 first) is asked decodeNextAction(state)
 *     and the first action returned is dispatched;
 *  3. rejected actions (GameError) are counted as invalid moves exactly like
 *     Game.updateInvalidMoves; any other exception ends the game as 'error';
 *  4. the loop guard ends the game as 'guard' when a turn/action limit is hit,
 *     so a game can never loop forever between actions.
 *
 * The only randomness is the seeded arbiter, so the same seed, decks and bots
 * always produce the same game.
 */
export function playGame(
  seats: [GameSeat, GameSeat],
  seed: number,
  limits: Partial<GameLimits> = {},
  rules: Rules = new Rules()
): GameResult {
  const lim: GameLimits = { ...defaultGameLimits, ...limits };
  const started = Date.now();
  const store = new Store(new NoopHandler());
  store.state.rules = rules;
  const arbiter = new SeededArbiter(new Prng(seed));
  const ids = [1, 2];
  const ais: BotAi[] = seats.map((s, i) => s.bot.createBotAi(ids[i], s.deck));

  const result: GameResult = {
    seed,
    outcome: 'error',
    turns: 0,
    actions: 0,
    arbiterActions: 0,
    invalidMoves: [0, 0],
    invalidMoveMessages: {},
    prizesLeft: [6, 6],
    endReasons: [],
    finalPhase: '',
    durationMs: 0
  };

  const streak = [0, 0];
  let turnSeen = -1;
  let actionsThisTurn = 0;

  const finish = (): GameResult => {
    const state = store.state;
    result.turns = state.turn;
    result.finalPhase = GamePhase[state.phase];
    result.prizesLeft = [0, 1].map(i => state.players[i] ? state.players[i].getPrizeLeft() : 6) as [number, number];
    if (state.phase === GamePhase.FINISHED) {
      for (const log of state.logs) {
        const reason = endReasonLogs[log.message];
        if (reason !== undefined && !result.endReasons.includes(reason)) {
          result.endReasons.push(reason);
        }
      }
    }
    result.durationMs = Date.now() - started;
    return result;
  };

  const base = (seat?: number, action?: Action) => ({
    seat,
    action: action ? describeAction(action) : undefined,
    turn: store.state.turn,
    phase: GamePhase[store.state.phase]
  });

  try {
    for (let i = 0; i < 2; i++) {
      store.dispatch(new AddPlayerAction(ids[i], seats[i].name, seats[i].deck));
    }
  } catch (error) {
    result.outcome = 'error';
    result.error = errorInfo(error, { ...base(), source: 'setup' });
    return finish();
  }

  for (;;) {
    const state = store.state;

    if (state.phase === GamePhase.FINISHED) {
      if (result.outcome === 'illegal-moves') {
        return finish();
      }
      if (state.winner === GameWinner.PLAYER_1 || state.winner === GameWinner.PLAYER_2) {
        result.outcome = 'win';
        result.winnerSeat = state.winner === GameWinner.PLAYER_1 ? 0 : 1;
      } else if (state.winner === GameWinner.DRAW) {
        result.outcome = 'draw';
      } else {
        result.outcome = 'no-winner';
      }
      return finish();
    }

    if (result.firstSeat === undefined && state.turn >= 1) {
      // Recorded on the first loop iteration of turn 1.
      result.firstSeat = state.activePlayer;
    }

    // Shuffles and coin flips, like Game.handleArbiterPrompts.
    const unresolved = state.prompts.filter(p => p.result === undefined);
    let arbiterAction: Action | undefined;
    for (const prompt of unresolved) {
      arbiterAction = arbiter.resolvePrompt(state, prompt);
      if (arbiterAction !== undefined) {
        break;
      }
    }
    if (arbiterAction !== undefined) {
      result.arbiterActions += 1;
      try {
        store.dispatch(arbiterAction);
      } catch (error) {
        result.outcome = 'error';
        result.error = errorInfo(error, { ...base(undefined, arbiterAction), source: 'dispatch' });
        return finish();
      }
      continue;
    }

    // Loop guard.
    if (state.turn !== turnSeen) {
      turnSeen = state.turn;
      actionsThisTurn = 0;
    }
    if (state.turn > lim.maxTurns) {
      result.outcome = 'guard';
      result.guardReason = 'max-turns';
      return finish();
    }
    if (result.actions >= lim.maxActions) {
      result.outcome = 'guard';
      result.guardReason = 'max-actions';
      return finish();
    }
    if (actionsThisTurn >= lim.maxActionsPerTurn) {
      result.outcome = 'guard';
      result.guardReason = 'max-actions-per-turn';
      return finish();
    }

    // Ask the bots, seat 0 first (the server asks every bot on every change).
    let seat = -1;
    let action: Action | undefined;
    for (let i = 0; i < 2 && action === undefined; i++) {
      try {
        action = ais[i].decodeNextAction(state);
      } catch (error) {
        result.outcome = 'error';
        result.error = errorInfo(error, { ...base(i), source: 'decode' });
        return finish();
      }
      seat = i;
    }

    if (action === undefined) {
      result.outcome = 'stalled';
      return finish();
    }

    result.actions += 1;
    actionsThisTurn += 1;

    try {
      store.dispatch(action);
      streak[seat] = 0;
    } catch (error) {
      if (!(error instanceof GameError)) {
        result.outcome = 'error';
        result.error = errorInfo(error, { ...base(seat, action), source: 'dispatch' });
        return finish();
      }
      result.invalidMoves[seat] += 1;
      const key = `${describeAction(action)}: ${error.message}`;
      result.invalidMoveMessages[key] = (result.invalidMoveMessages[key] || 0) + 1;
      streak[seat] += 1;
      if (streak[seat] > lim.maxInvalidMoves) {
        result.outcome = 'illegal-moves';
        result.illegalMovesSeat = seat;
        try {
          store.dispatch(new AbortGameAction(ids[seat], AbortGameReason.ILLEGAL_MOVES));
        } catch (abortError) {
          // The abort itself failing is an engine error worth reporting.
          result.outcome = 'error';
          result.error = errorInfo(abortError, { ...base(seat), source: 'dispatch' });
          return finish();
        }
      }
    }
  }
}
