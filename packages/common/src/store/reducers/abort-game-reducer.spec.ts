import { AbortGameAction, AbortGameReason } from '../actions/abort-game-action';
import { CoinFlipPrompt } from '../prompts/coin-flip-prompt';
import { GameLog, GameMessage } from '../../game-message';
import { GamePhase, GameWinner, State } from '../state/state';
import { Store } from '../store';
import { createStore, createTurnState, dispatchError } from './reducer-test-utils';

describe('abortGameReducer', () => {

  let state: State;
  let store: Store;

  function logs(): string[] {
    return store.state.logs.map(l => l.message);
  }

  function setPrizesLeft(index: number, count: number) {
    const player = state.players[index];
    player.prizes.forEach((prize, i) => {
      if (i >= count) {
        prize.cards = [];
      }
    });
  }

  beforeEach(() => {
    state = createTurnState(5);
    store = createStore(state);
  });

  it('Should throw ILLEGAL_ACTION when culprit is not in the game', () => {
    expect(dispatchError(store, new AbortGameAction(99, AbortGameReason.DISCONNECTED)))
      .toBe(GameMessage.ILLEGAL_ACTION);
    expect(store.state.phase).toBe(GamePhase.PLAYER_TURN);
  });

  it('Should ignore the action when game is already finished', () => {
    state.phase = GamePhase.FINISHED;
    state.winner = GameWinner.PLAYER_1;
    store.dispatch(new AbortGameAction(99, AbortGameReason.DISCONNECTED));
    expect(store.state.winner).toBe(GameWinner.PLAYER_1);
    expect(store.state.logs.length).toBe(0);
  });

  it('Should log the reason of the abort', () => {
    store.dispatch(new AbortGameAction(1, AbortGameReason.TIME_ELAPSED));
    expect(logs()).toContain(GameLog.LOG_TIME_ELAPSED);
    expect(store.state.logs[0].params).toEqual({ name: 'Player 1' });

    store = createStore(createTurnState(5));
    store.dispatch(new AbortGameAction(1, AbortGameReason.ILLEGAL_MOVES));
    expect(logs()).toContain(GameLog.LOG_BANNED_BY_ARBITER);

    store = createStore(createTurnState(5));
    store.dispatch(new AbortGameAction(2, AbortGameReason.DISCONNECTED));
    expect(logs()).toContain(GameLog.LOG_PLAYER_LEFT_THE_GAME);
    expect(store.state.logs[0].params).toEqual({ name: 'Player 2' });
  });

  it('Should resolve all pending prompts with null', () => {
    const prompt = new CoinFlipPrompt(1, GameMessage.COIN_FLIP);
    const resolved = new CoinFlipPrompt(2, GameMessage.COIN_FLIP);
    resolved.result = true;
    state.prompts.push(prompt, resolved);

    store.dispatch(new AbortGameAction(1, AbortGameReason.DISCONNECTED));

    expect(prompt.result).toBeNull();
    expect(resolved.result).toBe(true);
    expect(store.state.phase).toBe(GamePhase.FINISHED);
  });

  it('Should finish with no winner when game has not started', () => {
    state.phase = GamePhase.WAITING_FOR_PLAYERS;
    store.dispatch(new AbortGameAction(1, AbortGameReason.DISCONNECTED));
    expect(store.state.phase).toBe(GamePhase.FINISHED);
    expect(store.state.winner).toBe(GameWinner.NONE);
    expect(logs()).toContain(GameLog.LOG_GAME_FINISHED_BEFORE_STARTED);
  });

  it('Should finish with no winner during the setup phase', () => {
    state.phase = GamePhase.SETUP;
    setPrizesLeft(1, 1);
    store.dispatch(new AbortGameAction(1, AbortGameReason.TIME_ELAPSED));
    expect(store.state.phase).toBe(GamePhase.FINISHED);
    expect(store.state.winner).toBe(GameWinner.NONE);
  });

  it('Should finish with no winner in the first two turns when prizes are equal', () => {
    state.turn = 2;
    store.dispatch(new AbortGameAction(1, AbortGameReason.DISCONNECTED));
    expect(store.state.phase).toBe(GamePhase.FINISHED);
    expect(store.state.winner).toBe(GameWinner.NONE);
    expect(logs()).toContain(GameLog.LOG_GAME_FINISHED);
  });

  it('Should give the win to opponent in the first two turns when prizes differ', () => {
    state.turn = 1;
    setPrizesLeft(1, 5);
    store.dispatch(new AbortGameAction(1, AbortGameReason.DISCONNECTED));
    expect(store.state.winner).toBe(GameWinner.PLAYER_2);
  });

  it('Should give the win to opponent when prizes are equal after turn 2', () => {
    store.dispatch(new AbortGameAction(1, AbortGameReason.DISCONNECTED));
    expect(store.state.phase).toBe(GamePhase.FINISHED);
    expect(store.state.winner).toBe(GameWinner.PLAYER_2);
    expect(logs()).toContain(GameLog.LOG_GAME_FINISHED_WINNER);
  });

  it('Should give the win to player 1 when player 2 aborts with more prizes left', () => {
    setPrizesLeft(0, 2);
    store.dispatch(new AbortGameAction(2, AbortGameReason.ILLEGAL_MOVES));
    expect(store.state.winner).toBe(GameWinner.PLAYER_1);
    const log = store.state.logs.find(l => l.message === GameLog.LOG_GAME_FINISHED_WINNER);
    expect(log?.params).toEqual({ name: 'Player 1' });
  });

  it('Should end in a draw when culprit has fewer prizes left than opponent', () => {
    setPrizesLeft(0, 1);
    store.dispatch(new AbortGameAction(1, AbortGameReason.TIME_ELAPSED));
    expect(store.state.phase).toBe(GamePhase.FINISHED);
    expect(store.state.winner).toBe(GameWinner.DRAW);
    expect(logs()).toContain(GameLog.LOG_GAME_FINISHED_DRAW);
  });

  it('Should be dispatched even when prompts are pending (abort bypasses ACTION_IN_PROGRESS)', () => {
    state.phase = GamePhase.BETWEEN_TURNS;
    state.prompts.push(new CoinFlipPrompt(2, GameMessage.COIN_FLIP));
    store.dispatch(new AbortGameAction(2, AbortGameReason.DISCONNECTED));
    expect(store.state.winner).toBe(GameWinner.PLAYER_1);
  });

});
