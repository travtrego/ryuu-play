import { AttackAction } from '../actions/game-actions';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { Rules } from '../state/rules';
import { createStore, createTurnState } from '../reducers/reducer-test-utils';

describe('gameReducer - first-turn attack rule', () => {

  function attack(turn: number, rules: Partial<Rules>) {
    const state = createTurnState(turn);
    state.rules = new Rules(rules);
    const store = createStore(state);
    let error: any;
    try {
      store.dispatch(new AttackAction(1, 'Test attack'));
    } catch (e) {
      error = e;
    }
    return { store, error };
  }

  it('Should allow attacking on turn 1 by default (older formats)', () => {
    const { store, error } = attack(1, {});
    expect(error).toBeUndefined();
    expect(store.state.players[1].active.damage).toEqual(10);
  });

  it('Should block attacking on turn 1 when firstTurnAttack is false', () => {
    const { store, error } = attack(1, { firstTurnAttack: false });
    expect(error instanceof GameError).toBeTrue();
    expect(error.message).toEqual(GameMessage.CANNOT_USE_ATTACK);
    expect(store.state.players[1].active.damage).toEqual(0);
    expect(store.state.activePlayer).toEqual(0);
  });

  it('Should allow the second player to attack on turn 2', () => {
    const { store, error } = attack(2, { firstTurnAttack: false });
    expect(error).toBeUndefined();
    expect(store.state.players[1].active.damage).toEqual(10);
  });

  it('Should treat a missing firstTurnAttack (old saved games) as allowed', () => {
    const state = createTurnState(1);
    delete (state.rules as any).firstTurnAttack;
    const store = createStore(state);
    store.dispatch(new AttackAction(1, 'Test attack'));
    expect(store.state.players[1].active.damage).toEqual(10);
  });

});
