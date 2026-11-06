import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Spearow } from '../../../src/ex-sets/set-sandstorm/spearow';
import { TestUtils } from '../../test-utils';

describe('Spearow SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Spearow()], [CardType.COLORLESS]);
  });

  // Super Speed - Flip a coin. If heads, prevent all effects of an attack, including damage, done to Spearow during
  // your opponent's next turn.
  it('Should use Super Speed - heads prevents damage during the opponent\'s next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Super Speed'));
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Super Speed - tails does not prevent damage', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Super Speed'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Super Speed - effect ends after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Super Speed'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });

  // Peck (10)
  it('Should use Peck', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Peck'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});
