import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { Psyduck } from '../../../src/base-sets/set-fossil/psyduck';
import { Gambler } from '../../../src/base-sets/set-fossil/gambler';
import { TestUtils } from '../../test-utils';

describe('Psyduck FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Psyduck()],
      [CardType.PSYCHIC, CardType.WATER]
    );
  });

  function opponentPlaysTrainer(): string {
    const opponent = sim.store.state.players[1];
    opponent.hand.cards.unshift(new Gambler());
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(2, 0, TestUtils.target(sim, undefined, opponent)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Headache - Your opponent can't play Trainer cards during his or her next turn.
  it('Should use Headache and block the opponent\'s Trainer cards', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Headache'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    expect(opponentPlaysTrainer()).toEqual(GameMessage.BLOCKED_BY_EFFECT);
  });

  it('Should use Headache - the effect ends after the opponent\'s next turn', () => {
    sim.dispatch(new AttackAction(1, 'Headache'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));

    expect(opponentPlaysTrainer()).toEqual('');
  });

  it('Should use Headache - does not block own Trainer cards', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Headache'));
    sim.dispatch(new PassTurnAction(2));

    player.hand.cards.unshift(new Gambler());
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    expect(message).toEqual('');
  });

  // Fury Swipes (10×) - Flip 3 coins. This attack does 10 damage times the number of heads.
  it('Should use Fury Swipes - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Fury Swipes - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Fury Swipes - 3 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(opponent.active.damage).toEqual(0);
  });
});
