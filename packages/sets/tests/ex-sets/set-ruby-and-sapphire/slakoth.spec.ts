import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Slakoth } from '../../../src/ex-sets/set-ruby-and-sapphire/slakoth';
import { TestUtils } from '../../test-utils';

describe('Slakoth RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Slakoth()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Claw (20) - Flip a coin. If tails, this attack does nothing.
  it('Should use Claw - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Claw'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Claw - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Claw'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Slack Off - Remove all damage counters from Slakoth. Slakoth can't attack during your next turn.
  it('Should use Slack Off - remove all damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Slack Off'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Slack Off - can\'t attack during next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slack Off'));
    sim.dispatch(new PassTurnAction(2));

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Claw'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Claw'));
    // the rejected action restored a state backup, so read the opponent again
    expect(TestUtils.getAll(sim).opponent.active.damage).toEqual(20);
    expect(opponent).toBeDefined();
  });

});
