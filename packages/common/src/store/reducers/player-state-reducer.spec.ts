import { ChangeAvatarAction } from '../actions/change-avatar-action';
import { GameLog, GameMessage } from '../../game-message';
import { ReorderBenchAction, ReorderHandAction } from '../actions/reorder-actions';
import { State } from '../state/state';
import { StateLog } from '../state/state-log';
import { Store } from '../store';
import { TestBasic, TestEnergy, createStore, createTurnState, dispatchError } from './reducer-test-utils';

describe('playerStateReducer', () => {

  let state: State;
  let store: Store;

  beforeEach(() => {
    state = createTurnState(3);
    store = createStore(state);
  });

  describe('ReorderBenchAction', () => {
    it('Should swap two bench slots', () => {
      const bench = state.players[1].bench;
      bench[0].pokemons.cards = [new TestBasic('A')];
      const slot0 = bench[0];
      const slot3 = bench[3];
      // Works for the inactive player too
      store.dispatch(new ReorderBenchAction(2, 0, 3));
      expect(state.players[1].bench[0]).toBe(slot3);
      expect(state.players[1].bench[3]).toBe(slot0);
    });

    it('Should throw ILLEGAL_ACTION for unknown player or source slot', () => {
      expect(dispatchError(store, new ReorderBenchAction(9, 0, 1))).toBe(GameMessage.ILLEGAL_ACTION);
      expect(dispatchError(store, new ReorderBenchAction(1, 5, 1))).toBe(GameMessage.ILLEGAL_ACTION);
    });

    it('Should throw ILLEGAL_ACTION for a destination outside of the bench', () => {
      const bench = state.players[0].bench;
      expect(dispatchError(store, new ReorderBenchAction(1, 0, 7))).toBe(GameMessage.ILLEGAL_ACTION);
      expect(bench.length).toBe(5);
      expect(bench.every(b => b !== undefined)).toBe(true);
    });
  });

  describe('ReorderHandAction', () => {
    it('Should apply the new hand order', () => {
      const a = new TestBasic('A');
      const b = new TestEnergy();
      state.players[0].hand.cards = [a, b];
      store.dispatch(new ReorderHandAction(1, [1, 0]));
      expect(state.players[0].hand.cards).toEqual([b, a]);
    });

    it('Should throw ILLEGAL_ACTION when order length does not match', () => {
      state.players[0].hand.cards = [new TestEnergy()];
      expect(dispatchError(store, new ReorderHandAction(1, [0, 1]))).toBe(GameMessage.ILLEGAL_ACTION);
      expect(dispatchError(store, new ReorderHandAction(9, [0]))).toBe(GameMessage.ILLEGAL_ACTION);
    });
  });

  describe('ChangeAvatarAction', () => {
    it('Should change avatar without log', () => {
      store.dispatch(new ChangeAvatarAction(2, 'pikachu.png'));
      expect(state.players[1].avatarName).toBe('pikachu.png');
      expect(state.logs.length).toBe(0);
    });

    it('Should change avatar and append the log', () => {
      const log = new StateLog(GameLog.LOG_TEXT, { text: 'new avatar' });
      store.dispatch(new ChangeAvatarAction(1, 'eevee.png', log));
      expect(state.players[0].avatarName).toBe('eevee.png');
      expect(state.logs.length).toBe(1);
      expect(state.logs[0].message).toBe(GameLog.LOG_TEXT);
      expect(state.logs[0].params).toEqual({ text: 'new avatar' });
      expect(state.logs[0].client).toBe(1);
    });

    it('Should throw ILLEGAL_ACTION for unknown player', () => {
      expect(dispatchError(store, new ChangeAvatarAction(9, 'x.png'))).toBe(GameMessage.ILLEGAL_ACTION);
    });
  });

});
