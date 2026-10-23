import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Slakoth } from '../../../src/ex-sets/set-sandstorm/slakoth';
import { TestUtils } from '../../test-utils';

describe('Slakoth SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Slakoth()], [CardType.COLORLESS]);
  });

  function attack(): string {
    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Lazy Punch'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Lazy Punch (10) - Slakoth can't attack during your next turn.
  it('Should use Lazy Punch', () => {
    const { opponent } = TestUtils.getAll(sim);

    expect(attack()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should not attack during the next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    attack();
    sim.dispatch(new PassTurnAction(2));

    expect(attack()).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should attack again during the turn after next', () => {
    const { opponent } = TestUtils.getAll(sim);

    attack();
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));

    expect(attack()).toEqual('');
    expect(opponent.active.damage).toEqual(20);
  });
});
